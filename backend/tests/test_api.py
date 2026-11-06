"""Ahicadde API entegrasyon testleri.

Butun API katmani TestClient uzerinden, bellek-ici SQLite veritabaniyla test edilir.
"""
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from conftest import login, promote_to_admin, register

API = "/api/v1"


@pytest.fixture()
def category(admin):
    res = admin.post(f"{API}/categories", json={"name": "Gida", "slug": "gida"})
    assert res.status_code == 201
    return res.json()


def create_product(admin, category_id, slug="lokum", stock=10, name="Haci Lokum"):
    return admin.post(
        f"{API}/products",
        json={
            "name": name,
            "slug": slug,
            "description": "El yapimi Afyon lokumu",
            "price": "129.90",
            "stock": stock,
            "category_id": category_id,
            "brand_id": None,
        },
    )


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
class TestHealth:
    def test_root(self, client):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["name"] == "Ahicadde"

    def test_health(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

    def test_health_db(self, client):
        res = client.get("/health/db")
        assert res.status_code == 200
        assert res.json()["database"] == "connected"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TestAuth:
    def test_register_success(self, client):
        res = register(client, "yeni@example.com")

        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "yeni@example.com"
        assert body["role"] == "customer"
        assert body["is_active"] is True
        assert "password_hash" not in body

    def test_register_duplicate_email(self, client):
        register(client, "ayni@example.com")
        res = register(client, "ayni@example.com")

        assert res.status_code == 409

    def test_register_short_password(self, client):
        res = register(client, "kisa@example.com", password="kisa")

        assert res.status_code == 422

    def test_login_success_sets_cookie(self, client):
        register(client, "giris@example.com")
        res = login(client, "giris@example.com")

        assert res.status_code == 200
        assert "access_token" in client.cookies

    def test_login_wrong_password(self, client):
        register(client, "yanlis@example.com")
        res = login(client, "yanlis@example.com", password="YanlisSifre!1")

        assert res.status_code == 401

    def test_me_requires_auth(self, client):
        res = client.get(f"{API}/auth/me")
        assert res.status_code == 401

    def test_me_with_cookie(self, client):
        register(client, "ben@example.com")
        login(client, "ben@example.com")

        res = client.get(f"{API}/auth/me")
        assert res.status_code == 200
        assert res.json()["email"] == "ben@example.com"

    def test_expired_token_rejected(self, client):
        register(client, "gecmis@example.com")

        now = datetime.now(timezone.utc)
        expired_token = pyjwt.encode(
            {
                "sub": "1",
                "role": "customer",
                "iat": now - timedelta(hours=2),
                "exp": now - timedelta(hours=1),
            },
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )

        client.cookies.set("access_token", expired_token)
        res = client.get(f"{API}/auth/me")

        assert res.status_code == 401

    def test_logout_clears_session(self, client):
        register(client, "cikis@example.com")
        login(client, "cikis@example.com")
        client.post(f"{API}/auth/logout")

        res = client.get(f"{API}/auth/me")
        assert res.status_code == 401

    def test_admin_test_requires_admin(self, customer):
        res = customer.get(f"{API}/auth/admin-test")
        assert res.status_code == 403

    def test_admin_test_with_admin(self, admin):
        res = admin.get(f"{API}/auth/admin-test")
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
class TestCategories:
    def test_create_requires_auth(self, client):
        res = client.post(f"{API}/categories", json={"name": "Gida", "slug": "gida"})
        assert res.status_code == 401

    def test_create_forbidden_for_customer(self, customer):
        res = customer.post(f"{API}/categories", json={"name": "Gida", "slug": "gida"})
        assert res.status_code == 403

    def test_create_and_get_by_slug(self, admin):
        res = admin.post(f"{API}/categories", json={"name": "Gida", "slug": "gida"})
        assert res.status_code == 201
        assert res.json()["slug"] == "gida"

        fetched = admin.get(f"{API}/categories/gida")
        assert fetched.status_code == 200
        assert fetched.json()["name"] == "Gida"

    def test_duplicate_slug_conflict(self, admin):
        admin.post(f"{API}/categories", json={"name": "Gida", "slug": "gida"})
        res = admin.post(f"{API}/categories", json={"name": "Baska", "slug": "gida"})

        assert res.status_code == 409

    def test_list_categories(self, admin):
        admin.post(f"{API}/categories", json={"name": "Gida", "slug": "gida"})
        admin.post(f"{API}/categories", json={"name": "Tekstil", "slug": "tekstil"})

        res = admin.get(f"{API}/categories")
        assert res.status_code == 200
        assert {c["slug"] for c in res.json()} == {"gida", "tekstil"}

    def test_get_unknown_category(self, admin):
        res = admin.get(f"{API}/categories/olmayan")
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class TestProducts:
    def test_create_requires_auth(self, client, category):
        res = client.post(f"{API}/products", json={"name": "X", "slug": "x", "price": "1", "category_id": category["id"]})
        assert res.status_code == 401

    def test_create_forbidden_for_customer(self, customer, category):
        res = customer.post(
            f"{API}/products",
            json={"name": "X", "slug": "x", "price": "1", "category_id": category["id"]},
        )
        assert res.status_code == 403

    def test_create_unknown_category(self, admin):
        res = create_product(admin, category_id=9999)
        assert res.status_code == 400
        assert res.json()["detail"] == "Category not found"

    def test_create_unknown_brand(self, admin, category):
        res = admin.post(
            f"{API}/products",
            json={
                "name": "Haci Lokum",
                "slug": "lokum",
                "price": "129.90",
                "stock": 5,
                "category_id": category["id"],
                "brand_id": 9999,
            },
        )
        assert res.status_code == 400

    def test_create_duplicate_slug(self, admin, category):
        create_product(admin, category_id=category["id"])
        res = create_product(admin, category_id=category["id"])

        assert res.status_code == 409

    def test_create_and_get_by_slug(self, admin, category):
        res = create_product(admin, category_id=category["id"])
        assert res.status_code == 201
        assert res.json()["is_active"] is True

        fetched = admin.get(f"{API}/products/lokum")
        assert fetched.status_code == 200
        assert fetched.json()["slug"] == "lokum"

    def test_list_pagination_and_category_filter(self, admin, category):
        admin.post(f"{API}/categories", json={"name": "Tekstil", "slug": "tekstil"})

        for i in range(5):
            create_product(admin, category_id=category["id"], slug=f"urun-{i}")

        res = admin.get(f"{API}/products?page=1&limit=3")
        assert res.status_code == 200
        assert len(res.json()) == 3

        res = admin.get(f"{API}/products?category=gida")
        assert res.status_code == 200
        assert len(res.json()) == 5

        res = admin.get(f"{API}/products?category=tekstil")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_hides_inactive(self, admin, category):
        create_product(admin, category_id=category["id"], slug="kapali-urun")

        # Kapatma islemi dogrudan DB uzerinden yapilir.
        with SessionLocal() as db:
            from app.models import Product

            product = db.scalar(select(Product).where(Product.slug == "kapali-urun"))
            product.is_active = False
            db.commit()

        res = admin.get(f"{API}/products")
        assert res.status_code == 200
        assert res.json() == []

        fetched = admin.get(f"{API}/products/kapali-urun")
        assert fetched.status_code == 404

    def test_get_unknown_product(self, admin):
        res = admin.get(f"{API}/products/olmayan-urun")
        assert res.status_code == 404

    def test_list_search_by_name(self, admin, category):
        create_product(admin, category_id=category["id"], slug="lokum")
        create_product(admin, category_id=category["id"], slug="cay", name="Rize Çayı")

        res = admin.get(f"{API}/products?q=rize")
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]["slug"] == "cay"

        # Arama kapsami ad + aciklamadir: "cay" urununun aciklamasindaki
        # "lokumu" terimi de eslesir.
        res = admin.get(f"{API}/products?q=LOKUM")
        assert res.status_code == 200
        assert {p["slug"] for p in res.json()} == {"lokum", "cay"}

        res = admin.get(f"{API}/products?q=olmayan")
        assert res.status_code == 200
        assert res.json() == []

    def test_related_products(self, admin, category):
        admin.post(f"{API}/categories", json={"name": "Tekstil", "slug": "tekstil"})
        tekstil = admin.get(f"{API}/categories/tekstil").json()

        for i in range(5):
            create_product(admin, category_id=category["id"], slug=f"urun-{i}")

        create_product(
            admin,
            category_id=tekstil["id"],
            slug="diger-kategori-urunu",
            name="Diğer",
        )

        # Ayni kategoriden 4 adet onerilmeli; urunun kendisi olmamali.
        res = admin.get(f"{API}/products/urun-0/related")
        assert res.status_code == 200

        related = res.json()
        assert len(related) == 4
        assert all(item["slug"] != "urun-0" for item in related)
        assert all(item["category_id"] == category["id"] for item in related)

        # Kategoride yeterli urun yoksa en yeni diger urunlerle tamamlanmali.
        res = admin.get(f"{API}/products/urun-4/related?limit=6")
        assert res.status_code == 200

        related = res.json()
        assert len(related) == 5
        assert any(item["slug"] == "diger-kategori-urunu" for item in related)

    def test_related_unknown_product(self, admin):
        res = admin.get(f"{API}/products/olmayan-urun/related")
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
class TestCart:
    def test_requires_auth(self, client):
        assert client.get(f"{API}/cart").status_code == 401
        assert client.post(f"{API}/cart/items", json={"product_id": 1, "quantity": 1}).status_code == 401

    def test_get_cart_creates_empty_cart(self, customer):
        res = customer.get(f"{API}/cart")
        assert res.status_code == 200
        assert res.json()["items"] == []

    def test_add_item(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"]).json()

        res = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 2})
        assert res.status_code == 201

        items = res.json()["items"]
        assert len(items) == 1
        assert items[0]["quantity"] == 2
        assert items[0]["product"]["slug"] == "lokum"

    def test_add_unknown_product(self, customer):
        res = customer.post(f"{API}/cart/items", json={"product_id": 9999, "quantity": 1})
        assert res.status_code == 404

    def test_add_merges_existing_item(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"]).json()

        customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 1})
        res = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 2})

        items = res.json()["items"]
        assert len(items) == 1
        assert items[0]["quantity"] == 3

    def test_add_exceeds_stock(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"], stock=5).json()

        res = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 6})
        assert res.status_code == 409

    def test_rejects_non_positive_quantity(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"]).json()

        res = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 0})
        assert res.status_code == 422

    def test_update_item_quantity(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"]).json()
        cart = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 1}).json()

        item_id = cart["items"][0]["id"]
        res = customer.patch(f"{API}/cart/items/{item_id}", json={"quantity": 4})

        assert res.status_code == 200
        assert res.json()["items"][0]["quantity"] == 4

    def test_update_other_users_item(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"]).json()
        cart = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 1}).json()
        item_id = cart["items"][0]["id"]

        # Yeni bir musteri ile giris yap; bu kullaniciya ait sepet item'i yok.
        register(admin, "diger@example.com")
        login(admin, "diger@example.com")
        res = admin.patch(f"{API}/cart/items/{item_id}", json={"quantity": 2})
        assert res.status_code == 404

    def test_delete_item(self, customer, admin, category):
        product = create_product(admin, category_id=category["id"]).json()
        cart = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 1}).json()
        item_id = cart["items"][0]["id"]

        res = customer.delete(f"{API}/cart/items/{item_id}")
        assert res.status_code == 204

        cart = customer.get(f"{API}/cart").json()
        assert cart["items"] == []


# ---------------------------------------------------------------------------
# Seller applications
# ---------------------------------------------------------------------------
def application_payload(**overrides):
    payload = {
        "full_name": "Ali Kose",
        "email": "ali@example.com",
        "phone": "05551112233",
        "city": "Ankara",
        "seller_type": "individual",
        "product_category": "El sanatlari",
        "product_description": "Ahit cagindan beri uretilen el yapimi seramik urunler.",
        "estimated_product_count": "1-10",
        "kvkk_consent": True,
        "website_url_hp": None,
    }
    payload.update(overrides)
    return payload


class TestSellerApplications:
    def test_create_requires_auth(self, client):
        res = client.post(f"{API}/seller-applications", json=application_payload())
        assert res.status_code == 401

    def test_create_success(self, customer):
        res = customer.post(f"{API}/seller-applications", json=application_payload())

        assert res.status_code == 201
        body = res.json()
        assert body["status"] == "pending"
        assert body["id"] > 0

    def test_create_with_filled_honeypot(self, customer):
        res = customer.post(
            f"{API}/seller-applications",
            json=application_payload(website_url_hp="http://spam.example"),
        )

        assert res.status_code == 201
        assert res.json()["id"] == 0

    def test_duplicate_pending_conflict(self, customer):
        customer.post(f"{API}/seller-applications", json=application_payload())
        res = customer.post(f"{API}/seller-applications", json=application_payload())

        assert res.status_code == 409

    def test_create_requires_kvkk_consent(self, customer):
        res = customer.post(
            f"{API}/seller-applications",
            json=application_payload(kvkk_consent=False),
        )
        assert res.status_code == 422

    def test_mine_requires_auth(self, client):
        res = client.get(f"{API}/seller-applications/mine")
        assert res.status_code == 401

    def test_mine_lists_own(self, customer):
        customer.post(f"{API}/seller-applications", json=application_payload())

        res = customer.get(f"{API}/seller-applications/mine")
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]["status"] == "pending"

    def test_admin_list_requires_admin(self, customer):
        res = customer.get(f"{API}/seller-applications/admin")
        assert res.status_code == 403

    def test_admin_list_and_status_filter(self, customer, admin):
        customer.post(f"{API}/seller-applications", json=application_payload())

        res = admin.get(f"{API}/seller-applications/admin")
        assert res.status_code == 200
        assert len(res.json()) == 1

        res = admin.get(f"{API}/seller-applications/admin?status=approved")
        assert res.json() == []

    def test_approve(self, customer, admin):
        application = customer.post(
            f"{API}/seller-applications", json=application_payload()
        ).json()

        res = admin.patch(f"{API}/seller-applications/admin/{application['id']}/approve")
        assert res.status_code == 200
        assert res.json()["status"] == "approved"

        res = admin.patch(f"{API}/seller-applications/admin/{application['id']}/approve")
        assert res.status_code == 409

    def test_reject(self, customer, admin):
        application = customer.post(
            f"{API}/seller-applications", json=application_payload()
        ).json()

        res = admin.patch(f"{API}/seller-applications/admin/{application['id']}/reject")
        assert res.status_code == 200
        assert res.json()["status"] == "rejected"

    def test_approve_unknown_application(self, admin):
        res = admin.patch(f"{API}/seller-applications/admin/9999/approve")
        assert res.status_code == 404
