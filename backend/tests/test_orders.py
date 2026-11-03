"""Siparis akisi testleri: checkout, stok yonetimi, iptal, admin durum guncelleme.

Butun API katmani TestClient uzerinden, bellek-ici SQLite veritabaniyla test edilir.
"""
from fastapi.testclient import TestClient

import app.main as app_main
from app.core.config import settings
from conftest import API, login, register


def create_category_and_product(admin, slug="lokum", stock=10, price="129.90"):
    category_slug = f"{slug}-kategori"
    res = admin.post(f"{API}/categories", json={"name": f"Gida {slug}", "slug": category_slug})
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
    return res.json()


def add_to_cart(client, product_id, quantity=2):
    res = client.post(
        f"{API}/cart/items",
        json={"product_id": product_id, "quantity": quantity},
    )
    assert res.status_code == 201
    return res.json()


def checkout(client, **overrides):
    payload = {
        "shipping_full_name": "Test Musteri",
        "shipping_phone": "05551112233",
        "shipping_city": "Istanbul",
        "shipping_district": "Kadikoy",
        "shipping_address": "Test Mahallesi Test Caddesi No: 1",
        "shipping_postal_code": "34710",
    }
    payload.update(overrides)
    return client.post(f"{API}/orders", json=payload)


def make_customer(email="diger@example.com"):
    other = TestClient(app_main.app, base_url="https://testserver")
    register(other, email)
    login(other, email)
    return other


def test_create_order_requires_auth(client):
    res = checkout(client)

    assert res.status_code == 401


def test_create_order_from_cart(customer, admin):
    product = create_category_and_product(admin)
    add_to_cart(customer, product["id"], quantity=2)

    res = checkout(customer)

    assert res.status_code == 201
    order = res.json()
    assert order["status"] == "pending_payment"
    assert order["payment_method"] == "iban_transfer"
    assert order["total_price"] == "259.80"
    assert order["shipping_full_name"] == "Test Musteri"
    assert order["shipping_city"] == "Istanbul"

    assert len(order["items"]) == 1
    item = order["items"][0]
    assert item["product_id"] == product["id"]
    assert item["product_name"] == "Haci Lokum"
    assert item["unit_price"] == "129.90"
    assert item["quantity"] == 2

    # Stok dusuruldu.
    res = admin.get(f"{API}/products/lokum")
    assert res.json()["stock"] == 8

    # Sepet bosaldi.
    res = customer.get(f"{API}/cart")
    assert res.status_code == 200
    assert res.json()["items"] == []


def test_create_order_empty_cart(customer):
    res = checkout(customer)

    assert res.status_code == 400
    assert "boş" in res.json()["detail"]


def test_create_order_multi_item_total(customer, admin):
    product_a = create_category_and_product(admin, slug="lokum", stock=5, price="100.00")
    product_b = create_category_and_product(admin, slug="simit", stock=3, price="50.50")

    add_to_cart(customer, product_a["id"], quantity=2)
    add_to_cart(customer, product_b["id"], quantity=1)

    res = checkout(customer)

    assert res.status_code == 201
    assert res.json()["total_price"] == "250.50"

    res = admin.get(f"{API}/products/lokum")
    assert res.json()["stock"] == 3

    res = admin.get(f"{API}/products/simit")
    assert res.json()["stock"] == 2


def test_create_order_insufficient_stock(customer, admin):
    product = create_category_and_product(admin, stock=10)

    # Adayinin sepetinde 2 adet var.
    add_to_cart(customer, product["id"], quantity=2)

    # Baska bir musteri 9 adet alarak stogu 1'e dusurur.
    other = make_customer("stok@example.com")
    add_to_cart(other, product["id"], quantity=9)
    assert checkout(other).status_code == 201

    res = checkout(customer)

    assert res.status_code == 409
    assert "yeterli stok yok" in res.json()["detail"]

    # Stok ve musteri sepeti degismedi.
    res = admin.get(f"{API}/products/lokum")
    assert res.json()["stock"] == 1

    res = customer.get(f"{API}/cart")
    assert len(res.json()["items"]) == 1


def test_order_history_newest_first_and_ownership(customer, admin):
    product = create_category_and_product(admin)

    add_to_cart(customer, product["id"], quantity=1)
    assert checkout(customer).status_code == 201

    add_to_cart(customer, product["id"], quantity=1)
    assert checkout(customer).status_code == 201

    res = customer.get(f"{API}/orders")
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) == 2
    assert orders[0]["id"] > orders[1]["id"]

    # Baska bir kullanici bu siparisleri goremez.
    other = make_customer()
    res = other.get(f"{API}/orders")
    assert res.status_code == 200
    assert res.json() == []

    res = other.get(f"{API}/orders/{orders[0]['id']}")
    assert res.status_code == 404


def test_get_order_detail_requires_auth(client, admin):
    product = create_category_and_product(admin)
    customer = make_customer()
    add_to_cart(customer, product["id"], quantity=1)
    order_id = checkout(customer).json()["id"]

    res = client.get(f"{API}/orders/{order_id}")
    assert res.status_code == 401


def test_cancel_order_restocks(customer, admin):
    product = create_category_and_product(admin)
    add_to_cart(customer, product["id"], quantity=2)
    order_id = checkout(customer).json()["id"]

    res = customer.post(f"{API}/orders/{order_id}/cancel")
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"

    res = admin.get(f"{API}/products/lokum")
    assert res.json()["stock"] == 10

    # Iptal edilmis siparis tekrar iptal edilemez.
    res = customer.post(f"{API}/orders/{order_id}/cancel")
    assert res.status_code == 409


def test_cancel_delivered_order_forbidden(customer, admin):
    product = create_category_and_product(admin)
    add_to_cart(customer, product["id"], quantity=1)
    order_id = checkout(customer).json()["id"]

    for new_status in ("processing", "shipped", "delivered"):
        res = admin.patch(f"{API}/orders/{order_id}/status", json={"status": new_status})
        assert res.status_code == 200

    res = customer.post(f"{API}/orders/{order_id}/cancel")
    assert res.status_code == 409


def test_admin_status_transitions(customer, admin):
    product = create_category_and_product(admin)
    add_to_cart(customer, product["id"], quantity=1)
    order_id = checkout(customer).json()["id"]

    for new_status in ("processing", "shipped", "delivered"):
        res = admin.patch(
            f"{API}/orders/{order_id}/status",
            json={"status": new_status},
        )
        assert res.status_code == 200
        assert res.json()["status"] == new_status

    # Son durumdaki siparisin durumu degistirilemez.
    res = admin.patch(f"{API}/orders/{order_id}/status", json={"status": "cancelled"})
    assert res.status_code == 409


def test_admin_cancel_from_processing_restocks(customer, admin):
    product = create_category_and_product(admin)
    add_to_cart(customer, product["id"], quantity=2)
    order_id = checkout(customer).json()["id"]

    res = admin.patch(f"{API}/orders/{order_id}/status", json={"status": "processing"})
    assert res.status_code == 200

    res = admin.patch(f"{API}/orders/{order_id}/status", json={"status": "cancelled"})
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"

    res = admin.get(f"{API}/products/lokum")
    assert res.json()["stock"] == 10


def test_status_update_requires_admin(customer):
    product_admin = make_customer("urun@example.com")
    # Urun olusturmak icin admin yetkisi gerekir; urunu admin ile ekleyelim.
    admin_client = TestClient(app_main.app, base_url="https://testserver")
    register(admin_client, "sepet@example.com")
    from conftest import promote_to_admin

    promote_to_admin("sepet@example.com")
    login(admin_client, "sepet@example.com")

    product = create_category_and_product(admin_client)
    add_to_cart(product_admin, product["id"], quantity=1)
    order_id = checkout(product_admin).json()["id"]

    res = product_admin.patch(
        f"{API}/orders/{order_id}/status",
        json={"status": "shipped"},
    )
    assert res.status_code == 403


def test_payment_info_is_public(client):
    res = client.get(f"{API}/orders/payment-info")

    assert res.status_code == 200
    data = res.json()
    assert data["payment_method"] == "iban_transfer"
    assert data["iban"] == settings.payment_iban
    assert data["receiver"] == settings.payment_receiver


def test_clear_cart(customer, admin):
    product = create_category_and_product(admin)
    add_to_cart(customer, product["id"], quantity=2)

    res = customer.delete(f"{API}/cart")
    assert res.status_code == 204

    res = customer.get(f"{API}/cart")
    assert res.json()["items"] == []
