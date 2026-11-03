from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

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
