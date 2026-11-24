"""Urun gorseli yukleme endpoint'i (/uploads) testleri.

Akis: giris yapan kullanici gorselleri multipart olarak gonderir ->
dosyalar sunucudaki uploads/products/ dizinine uuid ile kaydedilir ->
/api/v1/media/... URL'leri doner -> urun girisinde bu URL'ler kullanilir.
"""
from pathlib import Path

from fastapi.testclient import TestClient

import app.main as app_main
from app.api.v1.uploads import resolve_uploads_root
from conftest import API, register, login

# Kucuk gecerli PNG: 1x1 seffaf piksel (magic byte dogrulamasini gecer).
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d4944415478da63fcffff3f0300050201f4d95e680000000049454e44ae426082"
)


def _upload(customer, files):
    return customer.post(f"{API}/uploads", files=files)


class TestUploadEndpoint:
    def test_upload_requires_authentication(self):
        client = TestClient(app_main.app, base_url="https://testserver")

        res = _upload(
            client,
            [("files", ("cicek.png", PNG_BYTES, "image/png"))],
        )

        assert res.status_code == 401

    def test_upload_saves_file_and_returns_media_url(self, customer):
        res = _upload(
            customer,
            [("files", ("cicek.png", PNG_BYTES, "image/png"))],
        )

        assert res.status_code == 201
        body = res.json()["files"]
        assert len(body) == 1

        url = body[0]["url"]
        assert url.startswith("/api/v1/media/products/")
        assert url.endswith(".png")

        # Dosya gerçekten sunucudaki dizine yazildi mi?
        file_name = url.rsplit("/", 1)[-1]
        saved = resolve_uploads_root() / "products" / file_name
        assert saved.is_file()
        assert saved.read_bytes() == PNG_BYTES

    def test_upload_multiple_images_keeps_order(self, customer):
        files = [
            ("files", (f"cicek-{index}.png", PNG_BYTES, "image/png"))
            for index in range(5)
        ]

        res = _upload(customer, files)

        assert res.status_code == 201
        body = res.json()["files"]
        assert len(body) == 5
        assert all(item["url"].endswith(".png") for item in body)
        # URL'ler benzersiz olmali (uuid dosya adlari).
        assert len({item["url"] for item in body}) == 5

    def test_upload_rejects_more_than_five_files(self, customer):
        files = [
            ("files", (f"cicek-{index}.png", PNG_BYTES, "image/png"))
            for index in range(6)
        ]

        res = _upload(customer, files)

        assert res.status_code == 400
        assert "en fazla 5" in res.json()["detail"]

    def test_upload_rejects_unsupported_extension(self, customer):
        res = _upload(
            customer,
            [("files", ("zararli.html", PNG_BYTES, "text/html"))],
        )

        assert res.status_code == 400
        assert "desteklenmiyor" in res.json()["detail"]

    def test_upload_rejects_disguised_content(self, customer):
        # Uzanti .png ama icerigi gorsel degil (magic byte kontrolu).
        res = _upload(
            customer,
            [("files", ("tuzak.png", b"<script>alert(1)</script>", "image/png"))],
        )

        assert res.status_code == 400
        assert "görsel gibi görünmüyor" in res.json()["detail"]

    def test_upload_rejects_oversized_file(self, customer, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "max_upload_size_mb", 1)
        big_payload = PNG_BYTES + b"\x00" * (1024 * 1024 + 1)

        res = _upload(
            customer,
            [("files", ("buyuk.png", big_payload, "image/png"))],
        )

        assert res.status_code == 400
        assert "çok büyük" in res.json()["detail"]

    def test_upload_rejects_empty_file(self, customer):
        res = _upload(
            customer,
            [("files", ("bos.png", b"", "image/png"))],
        )

        assert res.status_code == 400
        assert "boş" in res.json()["detail"]

    def test_uploaded_image_can_be_attached_to_product(self, customer, admin):
        category_res = admin.post(
            f"{API}/categories",
            json={"name": "Dekorasyon", "slug": "dekorasyon"},
        )
        assert category_res.status_code == 201
        category = category_res.json()

        upload_res = _upload(
            customer,
            [
                ("files", ("kapak.png", PNG_BYTES, "image/png")),
                ("files", ("detay.png", PNG_BYTES, "image/png")),
            ],
        )
        assert upload_res.status_code == 201
        urls = [item["url"] for item in upload_res.json()["files"]]

        submit_res = customer.post(
            f"{API}/products/submissions",
            json={
                "name": "El Yapımı Seramik Vazo",
                "description": "Çarkta elle şekillendirilmiş bitkisel boyalı vazo.",
                "price": "349.90",
                "stock": 12,
                "category_id": category["id"],
                "image_urls": urls,
            },
        )

        assert submit_res.status_code == 201
        images = submit_res.json()["images"]
        assert [image["image_url"] for image in images] == urls
        assert images[0]["is_primary"] is True
        assert images[1]["is_primary"] is False
