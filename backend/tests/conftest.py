import os

# Uygulama modülleri import edilmeden önce test ortam değişkenleri ayarlanmalı.
os.environ["DATABASE_URL"] = "sqlite:///./ahicadde_test.db"
os.environ["JWT_SECRET"] = "test-secret-key-for-pytest"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import session as db_session
from app.db.session import Base
from app.models import User
import app.main as app_main
import app.models  # noqa: F401 - tum modelleri metadata'ya kaydeder

API = "/api/v1"

# Uygulamayi gercek DB yerine bellek-ici SQLite'a yonlendir.
_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(_test_engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


db_session.engine = _test_engine
db_session.SessionLocal = sessionmaker(
    bind=_test_engine,
    autocommit=False,
    autoflush=False,
)
app_main.engine = _test_engine

Base.metadata.create_all(_test_engine)


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(_test_engine)
    Base.metadata.create_all(_test_engine)
    yield
    Base.metadata.drop_all(_test_engine)


def register(client, email, password="S3curePass!123", **overrides):
    payload = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "Kullanici",
    }
    payload.update(overrides)
    return client.post(f"{API}/auth/register", json=payload)


def login(client, email, password="S3curePass!123"):
    return client.post(f"{API}/auth/login", json={"email": email, "password": password})


def promote_to_admin(email):
    with db_session.SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        user.role = "admin"
        db.commit()


@pytest.fixture()
def client():
    return TestClient(app_main.app, base_url="https://testserver")


@pytest.fixture()
def customer():
    client = TestClient(app_main.app, base_url="https://testserver")
    register(client, "musteri@example.com")
    login(client, "musteri@example.com")
    return client


@pytest.fixture()
def admin():
    client = TestClient(app_main.app, base_url="https://testserver")
    register(client, "yonetici@example.com")
    promote_to_admin("yonetici@example.com")
    login(client, "yonetici@example.com")
    return client


