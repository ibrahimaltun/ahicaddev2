"""E-posta dogrulama, sifre sifirlama ve rate-limit testleri."""
from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from app.api.v1 import auth as auth_module
from app.core.config import settings
from app.db import session as db_session
from app.models import User
from conftest import API, login, register


@pytest.fixture()
def reset_emails(monkeypatch):
    """Gonderilen e-postalari yakalar; console yerine testte kayit tutar."""
    sent: list[dict] = []

    def fake_send(to, subject, body):
        sent.append({"to": to, "subject": subject, "body": body})

    monkeypatch.setattr(auth_module.email_service, "send", fake_send)
    return sent


def extract_token(emails, subject_part):
    for item in emails:
        if subject_part in item["subject"]:
            # Baglanti bicimi: ...?token=<token><beyaz-metin...>
            return item["body"].split("token=", 1)[1].split()[0]
    raise AssertionError(f"E-posta bulunamadi: {subject_part}")


class TestEmailVerification:
    def test_register_sends_verification_email_and_user_unverified(self, client, reset_emails):
        response = register(client, "verify-me@example.com")

        assert response.status_code == 201
        assert response.json()["is_verified"] is False
        assert any("E-posta doğrulama" in item["subject"] for item in reset_emails)

    def test_verify_email_with_valid_token(self, client, reset_emails):
        register(client, "verify-me@example.com")
        token = extract_token(reset_emails, "doğrulama")

        response = client.post(f"{API}/auth/verify-email", json={"token": token})

        assert response.status_code == 200

        login(client, "verify-me@example.com")
        me = client.get(f"{API}/auth/me")
        assert me.json()["is_verified"] is True

    def test_verify_email_token_is_single_use(self, client, reset_emails):
        register(client, "verify-me@example.com")
        token = extract_token(reset_emails, "doğrulama")

        first = client.post(f"{API}/auth/verify-email", json={"token": token})
        second = client.post(f"{API}/auth/verify-email", json={"token": token})

        assert first.status_code == 200
        assert second.status_code == 400

    def test_verify_email_with_invalid_token(self, client):
        response = client.post(f"{API}/auth/verify-email", json={"token": "x" * 40})

        assert response.status_code == 400

    def test_send_verification_resends_for_unverified_user(self, client, reset_emails):
        register(client, "verify-me@example.com")
        login(client, "verify-me@example.com")
        assert len(reset_emails) == 1

        response = client.post(f"{API}/auth/send-verification")

        assert response.status_code == 200
        assert len(reset_emails) == 2

    def test_send_verification_rejected_for_verified_user(self, client, reset_emails):
        register(client, "verify-me@example.com")
        login(client, "verify-me@example.com")
        client.post(
            f"{API}/auth/verify-email",
            json={"token": extract_token(reset_emails, "doğrulama")},
        )

        response = client.post(f"{API}/auth/send-verification")

        assert response.status_code == 400

    def test_send_verification_requires_auth(self, client):
        response = client.post(f"{API}/auth/send-verification")

        assert response.status_code == 401


class TestPasswordReset:
    def test_forgot_password_sends_reset_link(self, client, reset_emails):
        register(client, "reset-me@example.com")

        response = client.post(
            f"{API}/auth/forgot-password",
            json={"email": "reset-me@example.com"},
        )

        assert response.status_code == 200
        assert any("Şifre sıfırlama" in item["subject"] for item in reset_emails)
        assert f"{settings.frontend_url}/sifre-sifirla?token=" in reset_emails[1]["body"]

    def test_forgot_password_unknown_email_returns_generic_response(self, client, reset_emails):
        response = client.post(
            f"{API}/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )

        assert response.status_code == 200
        assert reset_emails == []

    def test_reset_password_updates_credentials(self, client, reset_emails):
        register(client, "reset-me@example.com")
        client.post(
            f"{API}/auth/forgot-password",
            json={"email": "reset-me@example.com"},
        )
        token = extract_token(reset_emails, "Şifre sıfırlama")

        response = client.post(
            f"{API}/auth/reset-password",
            json={"token": token, "new_password": "N3wPassword!456"},
        )

        assert response.status_code == 200

        old_login = login(client, "reset-me@example.com", "S3curePass!123")
        new_login = login(client, "reset-me@example.com", "N3wPassword!456")

        assert old_login.status_code == 401
        assert new_login.status_code == 200

    def test_reset_password_token_is_single_use(self, client, reset_emails):
        register(client, "reset-me@example.com")
        client.post(
            f"{API}/auth/forgot-password",
            json={"email": "reset-me@example.com"},
        )
        token = extract_token(reset_emails, "Şifre sıfırlama")

        first = client.post(
            f"{API}/auth/reset-password",
            json={"token": token, "new_password": "N3wPassword!456"},
        )
        second = client.post(
            f"{API}/auth/reset-password",
            json={"token": token, "new_password": "An0therPass!789"},
        )

        assert first.status_code == 200
        assert second.status_code == 400

    def test_reset_password_expired_token_rejected(self, client, reset_emails):
        register(client, "reset-me@example.com")
        client.post(
            f"{API}/auth/forgot-password",
            json={"email": "reset-me@example.com"},
        )
        token = extract_token(reset_emails, "Şifre sıfırlama")

        with db_session.SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == "reset-me@example.com"))
            user.reset_token_expires = datetime.utcnow() - timedelta(minutes=1)
            db.commit()

        response = client.post(
            f"{API}/auth/reset-password",
            json={"token": token, "new_password": "N3wPassword!456"},
        )

        assert response.status_code == 400

    def test_reset_password_short_password_rejected(self, client):
        response = client.post(
            f"{API}/auth/reset-password",
            json={"token": "x" * 40, "new_password": "short"},
        )

        assert response.status_code == 422


class TestRateLimit:
    def test_login_email_limit(self, client):
        register(client, "ratelimit@example.com")

        for attempt in range(5):
            response = login(client, "ratelimit@example.com", "wrong-password")
            assert response.status_code == 401

        sixth = login(client, "ratelimit@example.com", "wrong-password")

        assert sixth.status_code == 429
        assert "Retry-After" in sixth.headers

    def test_register_ip_limit(self, client):
        for index in range(5):
            response = register(client, f"bulk{index}@example.com")
            assert response.status_code == 201

        sixth = register(client, "bulk5@example.com")

        assert sixth.status_code == 429

    def test_forgot_password_email_limit(self, client, reset_emails):
        register(client, "ratelimit@example.com")

        for _ in range(3):
            response = client.post(
                f"{API}/auth/forgot-password",
                json={"email": "ratelimit@example.com"},
            )
            assert response.status_code == 200

        fourth = client.post(
            f"{API}/auth/forgot-password",
            json={"email": "ratelimit@example.com"},
        )

        assert fourth.status_code == 429

    def test_login_after_limit_reset_allows_success(self, client):
        register(client, "ratelimit@example.com")

        for _ in range(5):
            login(client, "ratelimit@example.com", "wrong-password")

        auth_module.limiter.reset()

        response = login(client, "ratelimit@example.com", "S3curePass!123")

        assert response.status_code == 200