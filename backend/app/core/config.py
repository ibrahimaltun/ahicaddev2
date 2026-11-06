from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    # Rate limit altyapisi:
    # - "memory": tek proseslik kurulumlar icin bellek-ici limiter.
    # - "redis": coklu proses/makine kurulumlarinda paylasik limiter.
    #   redis paketi/sunucusu erisilemezse otomatik bellek-ici moda duser.
    rate_limit_backend: str = "memory"
    redis_url: str = "redis://localhost:6379/0"

    # Ters proxy arkasinda X-Forwarded-For okuma politikasi.
    # Varsayilan kapali: istemciler baslik uzerinden IP taklidi yapamaz.
    # Ters proxy arkasinda acilirken, guvenilir proxy IP'leri virgullu
    # liste olarak verilir (tek IP veya CIDR, orn. "10.0.0.0/8,127.0.0.1").
    trust_proxy_headers: bool = False
    trusted_proxies: str = ""

    payment_iban: str = "TR00 0000 0000 0000 0000 0000 0000"
    payment_receiver: str = "Ahicadde Ödemeleri"

    # E-posta dogrulama / sifre sifirlama
    frontend_url: str = "http://localhost:3100"
    email_backend: str = "console"  # "console" | "smtp"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "no-reply@ahicadde.local"
    email_verification_expire_hours: int = 24
    password_reset_expire_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=BASE_DIR.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
