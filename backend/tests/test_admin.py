"""Yonetim paneli (admin) API testleri: ozet, kullanicilar, urunler, siparisler, katalog aktarimi."""
from fastapi.testclient import TestClient

import app.api.v1.admin as admin_module
import app.main as app_main
from app.services.external_catalog import ExternalCatalogError
from conftest import API, login, register


def create_category_and_product(admin, slug="lokum", stock=10, price="129.90", active=True):
    res = admin.post(f"{API}/categories", json={"name": "Gida", "slug": f"{slug}-kategori"})
    assert res.status_code == 201
    category_id = res.json()["id"]

    res = admin.post(
        f"{API}/products",
        json={
            "name": "Haci Lokum",
            "slug": slug,
            "description": "El yapimi lokum",
            "price": price,
            "stock": stock,
            "category_id": category_id,
        },
    )
    assert res.status_code == 201
    product = res.json()

    if not active:
        res = admin.patch(
            f"{API}/admin/products/{product['id']}", json={"is_active": False}
        )
        assert res.status_code == 200

    return product


def checkout_as(client, product_id, quantity=2):
    res = client.post(
        f"{API}/cart/items", json={"product_id": product_id, "quantity": quantity}
    )
    assert res.status_code == 201

    res = client.post(
        f"{API}/orders",
        json={
            "shipping_full_name": "Test Musteri",
            "shipping_phone": "05551112233",
            "shipping_city": "Istanbul",
            "shipping_district": "Kadikoy",
            "shipping_address": "Test Mahallesi Test Caddesi No: 1",
        },
    )
    assert res.status_code == 201
    return res.json()


def make_customer(email="diger@example.com"):
    other = TestClient(app_main.app, base_url="https://testserver")
    register(other, email)
    login(other, email)
    return other


def submit_seller_application(client):
    res = client.post(
        f"{API}/seller-applications",
        json={
            "full_name": "Satici Basvuran",
            "email": "musteri@example.com",
            "phone": "05551112233",
            "city": "Istanbul",
            "seller_type": "sole_proprietor",
            "business_name": "Satici Isletme",
            "tax_number": "1234567890",
            "product_category": "El sanatlari",
            "product_description": "El yapimi seramik ve cini urunleri satarim.",
            "estimated_product_count": "11-50",
            "kvkk_consent": True,
        },
    )
    assert res.status_code == 201
    return res.json()


# --- Erisim kontrolu ---


def test_admin_endpoints_require_admin(customer):
    for method, path in [
        ("get", f"{API}/admin/stats"),
        ("get", f"{API}/admin/users"),
        ("patch", f"{API}/admin/users/1"),
        ("get", f"{API}/admin/products"),
        ("patch", f"{API}/admin/products/1"),
        ("delete", f"{API}/admin/products/1"),
        ("get", f"{API}/admin/orders"),
        ("post", f"{API}/admin/catalog/import"),
    ]:
        has_body = method in ("patch", "post")
        kwargs = {"json": {}} if has_body else {}
        res = getattr(customer, method)(path, **kwargs)
        assert res.status_code == 401 or res.status_code == 403, path


# --- Ozet (stats) ---


def test_admin_stats(admin, customer):
    product = create_category_and_product(admin)
    checkout_as(customer, product["id"])

    res = admin.get(f"{API}/admin/stats")

    assert res.status_code == 200
    stats = res.json()
    assert stats["users_total"] == 2
    assert stats["products_total"] == 1
    assert stats["products_active"] == 1
    assert stats["categories_total"] == 1
    assert stats["orders_total"] == 1
    assert stats["orders_by_status"]["pending_payment"] == 1
    assert stats["revenue_total"] == "259.80"
    assert stats["seller_applications_by_status"] == {}


# --- Kullanicilar ---


def test_admin_list_and_update_users(admin, customer):
    res = admin.get(f"{API}/admin/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) == 2

    customer_row = next(u for u in users if u["role"] == "customer")
    assert customer_row["email"] == "musteri@example.com"

    res = admin.patch(
        f"{API}/admin/users/{customer_row['id']}", json={"role": "admin"}
    )
    assert res.status_code == 200
    assert res.json()["role"] == "admin"

    res = admin.patch(
        f"{API}/admin/users/{customer_row['id']}", json={"is_active": False}
    )
    assert res.status_code == 200
    assert res.json()["is_active"] is False


def test_admin_cannot_demote_or_deactivate_self(admin):
    res = admin.get(f"{API}/admin/users")
    self_row = next(u for u in res.json() if u["role"] == "admin" and u["is_active"])

    res = admin.patch(f"{API}/admin/users/{self_row['id']}", json={"role": "customer"})
    assert res.status_code == 409

    res = admin.patch(f"{API}/admin/users/{self_row['id']}", json={"is_active": False})
    assert res.status_code == 409


def test_admin_user_search(admin, customer):
    res = admin.get(f"{API}/admin/users", params={"search": "musteri"})
    assert res.status_code == 200
    users = res.json()
    assert len(users) == 1
    assert users[0]["email"] == "musteri@example.com"


# --- Urunler ---


def test_admin_products_include_inactive(admin, customer):
    create_category_and_product(admin, slug="pasif-urun", active=False)
    create_category_and_product(admin, slug="aktif-urun")

    public_res = customer.get(f"{API}/products")
    assert len(public_res.json()) == 1

    res = admin.get(f"{API}/admin/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) == 2
    assert {p["is_active"] for p in products} == {True, False}


def test_admin_update_product(admin, customer):
    product = create_category_and_product(admin)

    res = admin.patch(
        f"{API}/admin/products/{product['id']}",
        json={"price": "199.99", "stock": 3, "name": "Haci Lokum Premium"},
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["price"] == "199.99"
    assert updated["stock"] == 3
    assert updated["name"] == "Haci Lokum Premium"
    assert updated["category_name"] == "Gida"

    res = admin.patch(f"{API}/admin/products/{product['id']}", json={"price": "-5"})
    assert res.status_code == 422


def test_admin_delete_product_removes_cart_items(admin, customer):
    product = create_category_and_product(admin)
    res = customer.post(f"{API}/cart/items", json={"product_id": product["id"], "quantity": 1})
    assert res.status_code == 201

    res = admin.delete(f"{API}/admin/products/{product['id']}")
    assert res.status_code == 204

    res = customer.get(f"{API}/cart")
    assert res.status_code == 200
    assert res.json()["items"] == []

    assert customer.get(f"{API}/products/{product['slug']}").status_code == 404


# --- Siparisler ---


def test_admin_list_orders_with_filter(admin, customer):
    product = create_category_and_product(admin)
    order = checkout_as(customer, product["id"])

    res = customer.get(f"{API}/admin/orders")
    assert res.status_code == 403

    res = admin.get(f"{API}/admin/orders")
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) == 1
    assert orders[0]["id"] == order["id"]
    assert orders[0]["user_email"] == "musteri@example.com"
    assert len(orders[0]["items"]) == 1

    res = admin.get(f"{API}/admin/orders", params={"status": "cancelled"})
    assert res.status_code == 200
    assert res.json() == []


# --- Satici basvurusu karar notu ---


def test_admin_approve_with_note(admin, customer):
    application = submit_seller_application(customer)

    res = admin.patch(
        f"{API}/seller-applications/admin/{application['id']}/approve",
        json={"admin_note": "Belgeler uygun, hos geldin."},
    )
    assert res.status_code == 200
    approved = res.json()
    assert approved["status"] == "approved"
    assert approved["admin_note"] == "Belgeler uygun, hos geldin."
    assert approved["decided_at"] is not None

    res = customer.get(f"{API}/seller-applications/mine")
    assert res.json()[0]["admin_note"] == "Belgeler uygun, hos geldin."


def test_admin_reject_with_note(admin, customer):
    application = submit_seller_application(customer)

    res = admin.patch(
        f"{API}/seller-applications/admin/{application['id']}/reject",
        json={"admin_note": "Urun kategorisi kapsamimizda degil."},
    )
    assert res.status_code == 200
    rejected = res.json()
    assert rejected["status"] == "rejected"
    assert rejected["admin_note"] == "Urun kategorisi kapsamimizda degil."

    # Reddedilen basvurudan sonra tekrar basvuru yapilabilmeli.
    res = admin.patch(
        f"{API}/seller-applications/admin/{application['id']}/reject",
        json={"admin_note": "ikinci deneme"},
    )
    assert res.status_code == 409


# --- Harici katalog aktarimi ---


def _sample_external_products():
    from app.services.external_catalog import ExternalProduct
    from decimal import Decimal

    return [
        ExternalProduct(
            name="Essence Mascara",
            slug="essence-mascara",
            description="Volumizing mascara",
            price=Decimal("219.99"),
            stock=12,
            category_name="Beauty",
            image_url="https://cdn.dummyjson.com/mascara.webp",
        ),
        ExternalProduct(
            name="Handcrafted Lamp",
            slug="handcrafted-lamp",
            description="Warm light",
            price=Decimal("999.50"),
            stock=8,
            category_name="Home Decoration",
            image_url=None,
        ),
    ]


def test_catalog_import_creates_categories_and_products(admin, monkeypatch):
    monkeypatch.setattr(
        admin_module, "fetch_dummyjson_products", lambda limit: _sample_external_products()
    )

    res = admin.post(f"{API}/admin/catalog/import", json={"limit": 30})

    assert res.status_code == 200
    body = res.json()
    assert body["created_products"] == 2
    assert body["created_categories"] == 2
    assert body["total_products"] == 2

    # Idempotent: ikinci aktarim ayni urunleri atlamali.
    res = admin.post(f"{API}/admin/catalog/import", json={"limit": 30})
    assert res.status_code == 200
    assert res.json()["skipped_products"] == 2
    assert res.json()["created_products"] == 0

    public = admin.get(f"{API}/products")
    assert len(public.json()) == 2

    detail = admin.get(f"{API}/products/essence-mascara")
    assert detail.status_code == 200
    assert detail.json()["images"][0]["image_url"] == "https://cdn.dummyjson.com/mascara.webp"


def test_catalog_import_requires_admin(customer):
    res = customer.post(f"{API}/admin/catalog/import", json={"limit": 5})
    assert res.status_code in (401, 403)


def test_catalog_import_external_failure_returns_502(admin, monkeypatch):
    def raise_error(limit):
        raise ExternalCatalogError("baglanti hatasi")

    monkeypatch.setattr(admin_module, "fetch_dummyjson_products", raise_error)

    res = admin.post(f"{API}/admin/catalog/import", json={"limit": 10})

    assert res.status_code == 502
    assert "baglanti hatasi" in res.json()["detail"]
