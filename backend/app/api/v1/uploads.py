"""Urun gorseli yukleme endpoint'i.

Dosyalar sunucudaki dosya dizinine (uploads/products/) uuid isimleriyle
kaydedilir; veritabaninda yalnizca /api/v1/media/... URL'si saklanir.
DB'ye binary koymak yerine dizin tercih edilir: goruntuleme static dosya
servisiyle (FastAPI StaticFiles) yapilir, DB sade ve yedeklenebilir kalir.
"""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api.v1.auth import get_current_user
from app.core.config import BASE_DIR, settings
from app.models import User

router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"],
)

# Gorsel URL'leri bu onekle doner; FastAPI main.py bu yolu static olarak
# sunar. /api/ oneki sayesinde hem Next.js rewrites hem prod reverse proxy
# (Caddy/Nginx) dogrudan backend'e iletiyor.
MEDIA_PUBLIC_PREFIX = "/api/v1/media"

# Kullanici tarafindan gonderilebilecek gorsel uzantilari.
ALLOWED_UPLOAD_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


def resolve_uploads_root() -> Path:
    """Yukleme kok dizinini dondurur (goreceli yol backend dizinine gore)."""
    uploads_dir = Path(settings.uploads_dir)

    if not uploads_dir.is_absolute():
        uploads_dir = BASE_DIR / uploads_dir

    return uploads_dir


def _sniff_extension(payload: bytes) -> str | None:
    """Dosya iceriginden (magic bytes) gercek formati tahmin eder."""
    if payload.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if payload.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if payload[:4] == b"RIFF" and payload[8:12] == b"WEBP":
        return "webp"
    if payload[:4] in (b"GIF8",):
        return "gif"
    return None


@router.post("", status_code=201)
async def upload_product_images(
    files: list[UploadFile],
    _current_user: User = Depends(get_current_user),
) -> dict[str, list[dict[str, object]]]:
    """Gorselleri sunucuya kaydeder; her biri icin public URL dondurur.

    - Kimlik dogrulamasi zorunlu (urun girisi ile ayni oturum).
    - Tek istekte 1-5 dosya; her dosya en fazla MAX_UPLOAD_SIZE_MB.
    - Uzanti + content-type + magic byte kontrolu yapilir.
    - Dosya adi sunucuda uretilir (uuid) -> path traversal / uzanti saldirisi yok.
    """
    if not files or len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bir istekte en az 1, en fazla 5 görsel yükleyebilirsiniz",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    product_dir = resolve_uploads_root() / "products"
    product_dir.mkdir(parents=True, exist_ok=True)

    uploaded: list[dict[str, object]] = []

    for index, upload in enumerate(files):
        original_name = upload.filename or ""
        extension = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
        declared_type = upload.content_type or ""

        allowed_extensions = ", ".join(sorted(ALLOWED_UPLOAD_EXTENSIONS))

        if extension not in ALLOWED_UPLOAD_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{index + 1}. dosya desteklenmiyor. "
                    f"İzinli uzantılar: {allowed_extensions}"
                ),
            )

        if declared_type and not declared_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{index + 1}. dosya bir görsel değil",
            )

        payload = await upload.read()

        if len(payload) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{index + 1}. dosya boş",
            )

        if len(payload) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{index + 1}. dosya çok büyük. "
                    f"En fazla {settings.max_upload_size_mb} MB yükleyebilirsiniz"
                ),
            )

        sniffed = _sniff_extension(payload)

        if sniffed is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{index + 1}. dosyanın içeriği bir görsel gibi görünmüyor. "
                    "Lütfen gerçek bir fotoğraf seçin"
                ),
            )

        file_name = f"{uuid4().hex}.{sniffed}"
        file_path = product_dir / file_name
        file_path.write_bytes(payload)

        uploaded.append(
            {
                "url": f"{MEDIA_PUBLIC_PREFIX}/products/{file_name}",
                "file_name": file_name,
                "size": len(payload),
            }
        )

    return {"files": uploaded}
