"""Musteri urun girisi + onay akisi testleri.

Akis: musteri giris yapar -> /products/submissions ile urun girer ->
urun 'pending' olur vitrinde gorunmez -> 5 dakika sonra otomatik onaylanir.
"""
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select

import app.main as app_main
from app.db.session import SessionLocal
from app.models import Product
from conftest import API, register, login

VALID_PRODUCT = {
    "name": "El Yapımı Seramik Vazo",
    "description": "Çarkta elle şekillendirilmiş, sırsız bitkisel boyalı seramik vazo.",
    "price": "349.90",
    "stock": 12,
    "category_id": None,
    "image_url": "https://images.example.com/vazo.jpg",
}


def _category(admin):
    res = admin.post(f"{API}/categories", json={"name": "Dekorasyon", "slug": "dekorasyon"})
    assert res.status_code == 201
    return res.json()


def _submit(customer, category_id, **overrides):
    payload = {**VALID_PRODUCT, "category_id": category_id, **overrides}
    return customer.post(f"{API}/products/submissions", json=payload)


def _set_submitted_at(product_slug: str, minutes_ago: int) -> None:
    """Otomatik onay suresini simule etmek icin submission zamanini kaydirir."""
    with SessionLocal() as db:
        product = db.scalar(select(Product).where(Product.slug == product_slug))
        assert product is not None
        product.submitted_at = datetime.utcnow() - timedelta(minutes=minutes_ago)
        db.commit()


class TestCustomerProductSubmissions:
    def test_submission_requires_authentication(self, client, admin):
        category = _category(admin)

        res = client.post(f"{API}/products/submissions", json={**VALID_PRODUCT, "category_id": category["id"]})

        assert res.status_code == 401

    def test_submission_goes_to_pending_and_hidden_from_vitrin(self, customer, admin):
        category = _category(admin)

        res = _submit(customer, category["id"])

        assert res.status_code == 201
        body = res.json()
        assert body["status"] == "pending"
        assert body["owner_user_id"] is not None
        assert body["submitted_at"] is not None
        assert body["slug"] == "el-yapimi-seramik-vazo"
        assert body["images"][0]["image_url"] == VALID_PRODUCT["image_url"]

        # Onay bekleyen urun vitrinde gorunmez.
        listing = customer.get(f"{API}/products")
        assert all(item["slug"] != body["slug"] for item in listing.json())

        detail = customer.get(f"{API}/products/{body['slug']}")
        assert detail.status_code == 404

    def test_submission_validations(self, customer, admin):
        category = _category(admin)

        # Kisa ad (schema seviyesi dogrulama -> 422)
        assert _submit(customer, category["id"], name="ab").status_code == 422

        # Bosluklu ad is mantigi kontrolunden gecmez -> 400
        assert _submit(customer, category["id"], name="   a   ").status_code == 400

        # Kisa aciklama (schema seviyesi -> 422)
        assert _submit(customer, category["id"], description="kısa").status_code == 422

        # Geçersiz fiyat (schema seviyesi -> 422)
        assert _submit(customer, category["id"], price="0").status_code == 422
        assert _submit(customer, category["id"], price="-5").status_code == 422

        # Negatif stok (schema seviyesi -> 422)
        assert _submit(customer, category["id"], stock=-1).status_code == 422

        # Var olmayan kategori (is mantigi -> 400)
        assert _submit(customer, 999999).status_code == 400

        # Gecersiz gorsel baglantisi (is mantigi -> 400)
        assert _submit(customer, category["id"], image_url="not-a-url").status_code == 400

        # Bos gorsel kabul edilir (opsiyonel)
        assert _submit(customer, category["id"], image_url=None).status_code == 201

    def test_duplicate_slug_gets_suffix(self, customer, admin):
        category = _category(admin)

        first = _submit(customer, category["id"])
        second = _submit(customer, category["id"])

        assert first.status_code == 201
        assert second.status_code == 201
        assert second.json()["slug"] == "el-yapimi-seramik-vazo-2"

    def test_pending_limit_per_user(self, customer, admin):
        category = _category(admin)

        for index in range(10):
            res = _submit(customer, category["id"], name=f"El Yapımı Test Ürün {index}")
            assert res.status_code == 201

        res = _submit(customer, category["id"], name="El Yapımı Limit Aşan")
        assert res.status_code == 400
        assert "onay bekleyen" in res.json()["detail"]

    def test_auto_approval_after_five_minutes(self, customer, admin):
        category = _category(admin)

        res = _submit(customer, category["id"])
        assert res.status_code == 201
        slug = res.json()["slug"]

        # 4 dakika gecti: hala onayda.
        _set_submitted_at(slug, minutes_ago=4)
        listing = customer.get(f"{API}/products")
        assert all(item["slug"] != slug for item in listing.json())

        # 6 dakika gecti: vitrin istegi urunu otomatik onaylar.
        _set_submitted_at(slug, minutes_ago=6)
        listing = customer.get(f"{API}/products")
        slugs = [item["slug"] for item in listing.json()]
        assert slug in slugs

        detail = customer.get(f"{API}/products/{slug}")
        assert detail.status_code == 200
        assert detail.json()["status"] == "approved"

    def test_my_submissions_lists_own_products_with_status(self, customer, admin):
        category = _category(admin)
        res = _submit(customer, category["id"])
        assert res.status_code == 201

        mine = customer.get(f"{API}/products/submissions")
        assert mine.status_code == 200
        items = mine.json()
        assert len(items) == 1
        assert items[0]["status"] == "pending"

        # Diger kullanici kendi listesinde bu urunu goremez.
        other = TestClient(app_main.app, base_url="https://testserver")
        register(other, "diger@example.com")
        login(other, "diger@example.com")
        other_mine = other.get(f"{API}/products/submissions")
        assert other_mine.json() == []

    def test_admin_products_list_exposes_status_and_filter(self, customer, admin):
        category = _category(admin)
        _submit(customer, category["id"])

        res = admin.get(f"{API}/admin/products?status=pending")
        assert res.status_code == 200
        pending_items = res.json()
        assert len(pending_items) == 1
        assert pending_items[0]["status"] == "pending"
        assert pending_items[0]["owner_user_id"] is not None

        res = admin.get(f"{API}/admin/products?status=approved")
        assert all(item["status"] == "approved" for item in res.json())

    def test_admin_product_stays_approved_immediately(self, admin):
        category = _category(admin)

        res = admin.post(
            f"{API}/products",
            json={
                "name": "Admin Ürünü",
                "slug": "admin-urunu",
                "description": "Admin tarafından eklenen ürün",
                "price": "10",
                "stock": 5,
                "category_id": category["id"],
            },
        )

        assert res.status_code == 201
        body = res.json()
        assert body["status"] == "approved"

        detail = admin.get(f"{API}/products/admin-urunu")
        assert detail.status_code == 200
