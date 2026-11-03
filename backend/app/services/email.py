"""E-posta gonderim servisi.

``email_backend`` ayarina gore iki mod:
- ``console`` (varsayilan): e-postayi log kaydina yazar; SMTP
  yapilandirilana kadar gelistirme/smoke ortamlari icindir.
- ``smtp``: settings'teki SMTP bilgileriyle gonderir.

Testlerde ``email_service.send`` monkeypatch edilerek gonderim
icerigi yakalanabilir.
"""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("ahicadde.email")


class EmailService:
    def send(self, to: str, subject: str, body: str) -> None:
        if settings.email_backend == "smtp":
            self._send_smtp(to, subject, body)
            return

        # Dev/smoke ortami: e-postayi stdout'a yazar (uvicorn logunda
        # token'li baglantiyi dogrudan gorulebilir kılar).
        print(
            f"\n[email:console] to={to} | subject={subject}\n{body}\n",
            flush=True,
        )

    def _send_smtp(self, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.email_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=15,
        ) as smtp:
            if settings.smtp_user:
                smtp.starttls()
                smtp.login(settings.smtp_user, settings.smtp_password)

            smtp.send_message(message)


email_service = EmailService()