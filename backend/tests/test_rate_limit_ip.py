"""Rate limiter arka ucu ve istemci IP cozumleme testleri.

- get_client_ip: X-Forwarded-For yalnizca guvenilir proxy ayarliyken itibar
  gorur (IP taklidi ile rate-limit bypass engellenir).
- RedisRateLimiter: ZSET tabanli kayan pencere + Redis hatasinda bellek-ici
  yedek davranisi (saglama fake Redis istemcisi kullanilir).
"""
import threading
import time

import pytest
from fastapi import HTTPException

from app.core import rate_limit as rate_limit_module
from app.core.config import settings
from conftest import API, register, login


class FakePipeline:
    """FakeRedis icin islem toplama (transaction=True) hattidir."""

    def __init__(self, store):
        self._store = store
        self._ops: list = []

    def zremrangebyscore(self, key, lo, hi):
        def op():
            bucket = self._store.get(key, [])
            self._store[key] = [
                (member, score)
                for member, score in bucket
                if not (float(lo) <= score <= float(hi))
            ]

        self._ops.append(op)

    def zcard(self, key):
        def op():
            return len(self._store.get(key, []))

        self._ops.append(op)

    def zadd(self, key, mapping):
        def op():
            bucket = [m for m, _ in self._store.get(key, [])]
            for member, score in mapping.items():
                if member in bucket:
                    self._store[key] = [
                        (m, s) for m, s in self._store[key] if m != member
                    ]
                self._store.setdefault(key, []).append((member, float(score)))

        self._ops.append(op)

    def expire(self, key, seconds):
        def op():
            return 1

        self._ops.append(op)

    def execute(self):
        results = [op() for op in self._ops]
        self._ops = []
        return results


class FakeRedis:
    """Rate limiter testleri icin minimal ZSET benzeri Redis duragani."""

    def __init__(self, fail: bool = False):
        self.store: dict = {}
        self.fail = fail

    def pipeline(self, transaction: bool = True):
        if self.fail:
            raise ConnectionError("redis down")
        return FakePipeline(self.store)

    def zrange(self, key, start, stop, withscores=False):
        if self.fail:
            raise ConnectionError("redis down")
        bucket = sorted(self.store.get(key, []), key=lambda item: item[1])
        selected = bucket[start:stop + 1 if stop >= 0 else None]
        if withscores:
            return [(member, score) for member, score in selected]
        return [member for member, _ in selected]

    def scan_iter(self, pattern):
        if self.fail:
            return iter([])
        return iter([key for key in self.store if key.startswith("ratelimit:")])

    def delete(self, *keys):
        for key in keys:
            self.store.pop(key, None)


class TestGetClientIp:
    def _request(self, headers=None, client_host="203.0.113.9"):
        """Starlette Request olusturur (dogrudan birim testi)."""
        from starlette.requests import Request

        scope = {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [],
            "query_string": b"",
            "client": (client_host, 51000),
            "server": ("testserver", 80),
            "scheme": "https",
        }
        if headers:
            scope["headers"] = [
                (key.lower().encode(), value.encode())
                for key, value in headers.items()
            ]
        return Request(scope)

    def test_default_ignores_spoofed_forwarded_for(self, monkeypatch):
        monkeypatch.setattr(settings, "trust_proxy_headers", False)

        request = self._request({"X-Forwarded-For": "1.2.3.4"})

        assert rate_limit_module.get_client_ip(request) == "203.0.113.9"

    def test_trusted_proxy_uses_forwarded_for(self, monkeypatch):
        monkeypatch.setattr(settings, "trust_proxy_headers", True)
        monkeypatch.setattr(settings, "trusted_proxies", "10.0.0.0/8")

        # Dogrudan baglanti guvenilir proxy'nin kendisi.
        request = self._request(
            {"X-Forwarded-For": "1.2.3.4, 10.1.2.3"},
            client_host="10.1.2.3",
        )

        assert rate_limit_module.get_client_ip(request) == "1.2.3.4"

    def test_trusted_proxy_chain_walks_all_hops(self, monkeypatch):
        monkeypatch.setattr(settings, "trust_proxy_headers", True)
        monkeypatch.setattr(settings, "trusted_proxies", "10.0.0.0/8, 10.1.2.3")

        request = self._request(
            {"X-Forwarded-For": "1.2.3.4, 10.1.2.3"},
            client_host="10.0.0.5",
        )

        assert rate_limit_module.get_client_ip(request) == "1.2.3.4"

    def test_untrusted_direct_connection_keeps_peer_ip(self, monkeypatch):
        monkeypatch.setattr(settings, "trust_proxy_headers", True)
        monkeypatch.setattr(settings, "trusted_proxies", "10.0.0.0/8")

        request = self._request({"X-Forwarded-For": "1.2.3.4"})

        # Dogrudan baglanti guvenilir degil -> basliga itibar edilmez.
        assert rate_limit_module.get_client_ip(request) == "203.0.113.9"

    def test_proxy_chain_without_headers_uses_peer(self, monkeypatch):
        monkeypatch.setattr(settings, "trust_proxy_headers", True)
        monkeypatch.setattr(settings, "trusted_proxies", "10.0.0.0/8")

        request = self._request()

        assert rate_limit_module.get_client_ip(request) == "203.0.113.9"

    def test_spoofed_header_cannot_bypass_rate_limit(self, client, monkeypatch):
        """Taklit edilen XFF ile limit surekli sifirlanamaz."""
        monkeypatch.setattr(settings, "trust_proxy_headers", False)

        register(client, "spoof@example.com")

        # Farkli IP'lerden geliyor gibi gorunen 5 hatali deneme.
        for index in range(5):
            res = client.post(
                f"{API}/auth/login",
                json={"email": "spoof@example.com", "password": "wrong"},
                headers={"X-Forwarded-For": f"198.51.100.{index}"},
            )
            assert res.status_code == 401

        # Ayni gercek IP'den geldigi icin 6. deneme limiter'a carpar.
        res = client.post(
            f"{API}/auth/login",
            json={"email": "spoof@example.com", "password": "wrong"},
            headers={"X-Forwarded-For": "198.51.100.77"},
        )
        assert res.status_code == 429


class TestRedisRateLimiter:
    def test_limit_enforced_and_window_clears(self):
        fake = FakeRedis()
        limiter = rate_limit_module.RedisRateLimiter(fake)

        for _ in range(3):
            limiter.check("login:1.2.3.4", limit=3, window_seconds=60)

        with pytest.raises(HTTPException) as exc:
            limiter.check("login:1.2.3.4", limit=3, window_seconds=60)

        assert exc.value.status_code == 429

        # Pencereyi temizle (eski kayitlar silinmis gibi) -> tekrar gecer.
        fake.store[f"ratelimit:login:1.2.3.4"] = []
        limiter.check("login:1.2.3.4", limit=3, window_seconds=60)

    def test_keys_are_scoped_by_key(self):
        fake = FakeRedis()
        limiter = rate_limit_module.RedisRateLimiter(fake)

        for _ in range(2):
            limiter.check("login:a", limit=2, window_seconds=60)

        # Baska anahtar etkilenmez.
        limiter.check("login:b", limit=2, window_seconds=60)

    def test_falls_back_to_memory_on_redis_error(self):
        failing = FakeRedis(fail=True)
        limiter = rate_limit_module.RedisRateLimiter(failing)

        for _ in range(2):
            limiter.check("login:x", limit=2, window_seconds=60)

        with pytest.raises(HTTPException) as exc:
            limiter.check("login:x", limit=2, window_seconds=60)

        assert exc.value.status_code == 429

    def test_reset_clears_state(self):
        fake = FakeRedis()
        limiter = rate_limit_module.RedisRateLimiter(fake)

        for _ in range(2):
            limiter.check("login:r", limit=2, window_seconds=60)

        limiter.reset()

        limiter.check("login:r", limit=2, window_seconds=60)