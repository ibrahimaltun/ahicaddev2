"""Oturum yonetimi testleri: refresh token rotasyonu, sifre degistirme.

Erisim tokeni 30 dakikalik; /auth/refresh ile sessiz yenileme + token
rotasyonu, /auth/change-password ile sifre degisiminde tum oturumlarin
dusurulmesi bu dosyada test edilir.
"""
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

import app.main as app_main
from app.api.v1 import auth as auth_module
from app.core.config import settings
from app.db import session as db_session
from app.models import User
from conftest import API, login, register


@pytest.fixture()
def auth_emails(monkeypatch):
    """Gonderilen e-postalari yakalar (console yerine test kaydi)."""
    sent: list[dict] = []

    def fake_send(to, subject, body):
        sent.append({"to": to, "subject": subject, "body": body})

    monkeypatch.setattr(auth_module.email_service, "send", fake_send)
    return sent


def get_refresh_cookie(client) -> str:
    value = client.cookies.get("refresh_token")
    assert value, "Login sonrasi refresh_token cookie bekleniyordu."
    return value


class TestRefreshFlow:
    def test_login_sets_refresh_cookie(self, client):
        register(client, "sess@example.com")
        login(client, "sess@example.com")

        get_refresh_cookie(client)

    def test_refresh_without_cookie_rejected(self, client):
        res = client.post(f"{API}/auth/refresh")

        assert res.status_code == 401

    def test_refresh_with_unknown_token_rejected(self, client):
        res = client.post(
            f"{API}/auth/refresh",
            cookies={"refresh_token": "anlamsiz-token-degeri"},
        )

        assert res.status_code == 401

    def test_refresh_rotates_token(self, client):
        register(client, "sess@example.com")
        login(client, "sess@example.com")
        old_token = get_refresh_cookie(client)

        res = client.post(f"{API}/auth/refresh")

        assert res.status_code == 200
        new_token = get_refresh_cookie(client)
        assert new_token != old_token

        # Eski token kullanildiktan sonra gecersiz (rotasyon).
        res = client.post(
            f"{API}/auth/refresh",
            cookies={"refresh_token": old_token},
        )
        assert res.status_code == 401

    def test_refresh_recovers_expired_access_token(self, client, monkeypatch):
        # Erisim tokenini hemen dolduracak sekilde ayarla (negatif sure).
        monkeypatch.setattr(settings, "access_token_expire_minutes", -1)

        register(client, "sess@example.com")
        login(client, "sess@example.com")

        # Erisim tokeni suresi doldu -> 401.
        me = client.get(f"{API}/auth/me")
        assert me.status_code == 401

        # Yenilemeden sonra normal sureye don; yeni access token gecerli olsun.
        monkeypatch.setattr(settings, "access_token_expire_minutes", 30)

        # Sessiz yenileme ile oturum geri gelir.
        refresh = client.post(f"{API}/auth/refresh")
        assert refresh.status_code == 200
        assert refresh.json()["user"]["email"] == "sess@example.com"

        me = client.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == "sess@example.com"

    def test_logout_revokes_refresh_token(self, client):
        register(client, "sess@example.com")
        login(client, "sess@example.com")
        token = get_refresh_cookie(client)

        assert client.post(f"{API}/auth/logout").status_code == 200

        res = client.post(
            f"{API}/auth/refresh",
            cookies={"refresh_token": token},
        )
        assert res.status_code == 401

    def test_refresh_typed_jwt_cannot_authorize(self, client):
        """typ=refresh ile uretilmis JWT erisim dogrulamasi icin kullanilamaz."""
        register(client, "sess@example.com")
        login(client, "sess@example.com")

        with db_session.SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == "sess@example.com"))

        now = datetime.now(timezone.utc)
        crafted = jwt.encode(
            {
                "sub": str(user.id),
                "role": user.role,
                "typ": "refresh",
                "iat": now,
                "exp": now + timedelta(minutes=30),
            },
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )

        res = client.get(
            f"{API}/auth/me",
            cookies={"access_token": crafted},
        )

        assert res.status_code == 401


class TestChangePassword:
    def test_change_password_requires_auth(self, client):
        res = client.post(
            f"{API}/auth/change-password",
            json={"current_password": "x", "new_password": "N3wPassword!456"},
        )

        assert res.status_code == 401

    def test_change_password_wrong_current_rejected(self, customer):
        res = customer.post(
            f"{API}/auth/change-password",
            json={"current_password": "yanlis-sifre", "new_password": "N3wPassword!456"},
        )

        assert res.status_code == 400

    def test_change_password_same_password_rejected(self, customer):
        res = customer.post(
            f"{API}/auth/change-password",
            json={
                "current_password": "S3curePass!123",
                "new_password": "S3curePass!123",
            },
        )

        assert res.status_code == 400

    def test_change_password_success_rotates_sessions_and_emails(
        self, customer, auth_emails
    ):
        # Iki oturum ac (ikinci cihaz benzetimi).
        other_device = TestClient(app_main.app, base_url="https://testserver")
        login(other_device, "musteri@example.com")
        other_refresh = get_refresh_cookie(other_device)

        res = customer.post(
            f"{API}/auth/change-password",
            json={
                "current_password": "S3curePass!123",
                "new_password": "N3wPassword!456",
            },
        )

        assert res.status_code == 200

        # Bildirim e-postasi gitti.
        assert any(
            "Şifreniz değiştirildi" in item["subject"] for item in auth_emails
        )

        # Eski sifre gecersiz, yeni sifre calisiyor.
        assert login(customer, "musteri@example.com", "S3curePass!123").status_code == 401
        assert login(customer, "musteri@example.com", "N3wPassword!456").status_code == 200

        # Diger cihazin refresh tokeni iptal edildi.
        res = other_device.post(
            f"{API}/auth/refresh",
            cookies={"refresh_token": other_refresh},
        )
        assert res.status_code == 401

    def test_reset_password_revokes_refresh_sessions(self, client, auth_emails):
        register(client, "reset-sess@example.com")
        login(client, "reset-sess@example.com")
        token = get_refresh_cookie(client)

        client.post(
            f"{API}/auth/forgot-password",
            json={"email": "reset-sess@example.com"},
        )

        reset_token = next(
            item["body"].split("token=", 1)[1].split()[0]
            for item in auth_emails
            if "Şifre sıfırlama" in item["subject"]
        )

        res = client.post(
            f"{API}/auth/reset-password",
            json={"token": reset_token, "new_password": "N3wPassword!456"},
        )
        assert res.status_code == 200

        # Sifre sifirlama eski oturumu da dusurmus olmali.
        res = client.post(
            f"{API}/auth/refresh",
            cookies={"refresh_token": token},
        )
        assert res.status_code == 401