"""Rate limiter: IP bazli kayan-pencere (sliding window) limitleri.

Iki arka uce sahiptir (tek degisim noktasi: ``limiter`` nesnesi):

- ``MemoryRateLimiter``: tek proseslik uvicorn kurulumlari icin varsayilan.
- ``RedisRateLimiter``: coklu proses / coklu makine kurulumlarinda paylasik
  sayac (Redis ZSET uzerinde kayan pencere). Redis erisilemezse calisma
  surdurulebilirligi icin otomatik olarak bellek-ici limiter'a duser.

``settings.rate_limit_backend`` ile secilir; Redis hatasi kalici bir ariza
degil, gecici bir düşme olarak ele alinir (uyari loglanir, bellek-ici
limiter devreye girer).
"""
import ipaddress
import logging
import random
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger("ahicadde.rate_limit")

RATE_LIMIT_MESSAGE = "Çok fazla deneme yaptınız. Lütfen kısa süre sonra tekrar deneyin."

REDIS_KEY_PREFIX = "ratelimit:"
_REDIS_ERROR_LOG_INTERVAL = 60.0  # saniye; hata loglarini bastirir


class MemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        """Anahtar icin limit asilirsa 429 firlatir, asilmazsa vurusu kaydeder."""
        now = time.monotonic()

        with self._lock:
            bucket = self._hits[key]

            while bucket and bucket[0] <= now - window_seconds:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=RATE_LIMIT_MESSAGE,
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

    def reset(self) -> None:
        """Tum vurus kayitlarini temizler (testler icin)."""
        with self._lock:
            self._hits.clear()


class RedisRateLimiter:
    """Redis ZSET uzerinde kayan-pencere limiter.

    Pencere girisleri `score = zaman` elemanlari olarak tutulur; her
    kontrolde pencere disindaki elemanlar silinir, sayi limit ile
    karsilastirilir. Redis hatasinda bellek-ici limiter'a duser.
    """

    def __init__(self, client, fallback: MemoryRateLimiter | None = None) -> None:
        self._client = client
        self._fallback = fallback if fallback is not None else MemoryRateLimiter()
        self._last_error_logged = 0.0

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        redis_key = f"{REDIS_KEY_PREFIX}{key}"
        now = time.time()
        window_start = now - window_seconds
        # Ayni saniyede gelen vuruslari ayirt etmek icin benzersiz uye.
        member = f"{now:.9f}:{random.getrandbits(64)}"

        try:
            pipe = self._client.pipeline(transaction=True)
            pipe.zremrangebyscore(redis_key, "-inf", window_start)
            pipe.zcard(redis_key)
            results = pipe.execute()
            current = int(results[1])

            if current >= limit:
                oldest = self._client.zrange(redis_key, 0, 0, withscores=True)

                if oldest:
                    retry_after = max(
                        1,
                        int(window_seconds - (now - float(oldest[0][1]))),
                    )
                else:
                    retry_after = window_seconds

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=RATE_LIMIT_MESSAGE,
                    headers={"Retry-After": str(retry_after)},
                )

            pipe = self._client.pipeline(transaction=True)
            pipe.zadd(redis_key, {member: now})
            pipe.expire(redis_key, window_seconds + 1)
            pipe.execute()
        except HTTPException:
            raise
        except Exception:
            # Surdurulebilirlik: Redis erisilemezse bellek-ici limiter ile devam.
            self._log_redis_error()
            self._fallback.check(key, limit, window_seconds)

    def reset(self) -> None:
        """Vurus kayitlarini temizler (testler icin)."""
        self._fallback.reset()

        try:
            keys = list(self._client.scan_iter(f"{REDIS_KEY_PREFIX}*"))

            if keys:
                self._client.delete(*keys)
        except Exception:
            pass

    def _log_redis_error(self) -> None:
        now = time.monotonic()

        if now - self._last_error_logged >= _REDIS_ERROR_LOG_INTERVAL:
            self._last_error_logged = now
            logger.warning(
                "Redis rate limiter erisilemiyor; bellek-ici limitera gecildi."
            )


def _build_limiter():
    """Ayarlarin ``rate_limit_backend`` degerine gore limiter uretir."""
    if settings.rate_limit_backend == "redis":
        try:
            import redis  # tip: ignore[import-untyped]
        except ImportError:
            logger.warning(
                "rate_limit_backend=redis ama redis paketi kurulu degil; "
                "bellek-ici limiter kullaniliyor."
            )
        else:
            try:
                client = redis.Redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
            except Exception:
                logger.warning("Redis istemcisi olusturulamadi; bellek-ici limiter.")
            else:
                return RedisRateLimiter(client)

    return MemoryRateLimiter()


limiter = _build_limiter()


def _parse_trusted_proxies() -> tuple[list[ipaddress.IPv4Network | ipaddress.IPv6Network], set[str]]:
    networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = []
    exact: set[str] = set()

    for part in settings.trusted_proxies.split(","):
        entry = part.strip()

        if not entry:
            continue

        try:
            networks.append(ipaddress.ip_network(entry, strict=False))
        except ValueError:
            exact.add(entry)

    return networks, exact


def _is_trusted(ip: str, networks, exact: set[str]) -> bool:
    if ip in exact:
        return True

    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return False

    return any(address in network for network in networks)


def get_client_ip(request: Request) -> str:
    """Rate-limit anahtari icin istemci IP'sini dondurur.

    Guvenlik varsayilani: ``X-Forwarded-For`` YOK SAYILIR. Ilk istemci
    bu basligi kendisi gonderebilecegi icin, guvenilir proxy ayarlanmadikca
    taklit edilen basliklar rate-limit anahtarini degistiremez.

    ``settings.trust_proxy_headers`` acikken yalnizca dogrudan baglanti
    guvenilir proxy listesindeyse XFF zincirinden (sagdan sola) gercek
    istemci IP'si secilir.
    """
    client_host = request.client.host if request.client else "unknown"

    if not settings.trust_proxy_headers:
        return client_host

    forwarded_for = request.headers.get("x-forwarded-for")

    if not forwarded_for:
        return client_host

    networks, exact = _parse_trusted_proxies()

    if not networks and not exact:
        return client_host

    def trusted(ip: str) -> bool:
        if ip in exact:
            return True

        try:
            address = ipaddress.ip_address(ip)
        except ValueError:
            return False

        return any(address in network for network in networks)

    chain = [hop.strip() for hop in forwarded_for.split(",") if hop.strip()]

    if not chain:
        return client_host

    # Dogrudan baglanti guvenilir degilse basliga hic itibar etme.
    if not trusted(client_host):
        return client_host

    candidate = chain[-1]

    # Sagdan sola dogru guvenilir proxy halkalarini atla.
    for index in range(len(chain) - 1, 0, -1):
        if not trusted(chain[index]):
            candidate = chain[index]

            break

        candidate = chain[index - 1]

    if trusted(candidate):
        # Tum zincir guvenilirse en soldaki girdi birinci istemcidir.
        return chain[0]

    return candidate


def rate_limit(*, scope: str, limit: int, window_seconds: int):
    """IP bazli rate limit FastAPI bagimliligi uretir.

    Kullanim: ``dependencies=[Depends(rate_limit(scope="login", limit=10, window_seconds=60))]``
    """
    def dependency(request: Request) -> None:
        limiter.check(
            f"{scope}:{get_client_ip(request)}",
            limit,
            window_seconds,
        )

    return dependency