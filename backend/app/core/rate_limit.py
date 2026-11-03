"""Bellek-ici kayan-pencere (sliding window) rate limiter.

Tek proseslik uvicorn kurulumlari icin yeterlidir. Coklu proses /
coklu makine kurulumlarinda Redis destekli bir limiter ile
degistirilmelidir (tek degisim noktasi: ``limiter`` nesnesi).
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

RATE_LIMIT_MESSAGE = "Çok fazla deneme yaptınız. Lütfen kısa süre sonra tekrar deneyin."


class RateLimiter:
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


limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """Ters proxy arkasinda gercek istemci IP'sini dondurmeye calisir."""
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


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