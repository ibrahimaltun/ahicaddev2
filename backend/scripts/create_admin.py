"""İlk yönetici (admin) hesabını oluşturur veya mevcut kullanıcıyı yükseltir.

Kullanım (backend dizininden):

    python scripts/create_admin.py --email admin@ahicadde.com --password S3curePass!123
    python scripts/create_admin.py --email mevcut@kullanici.com --promote

- `--password` verilirse kullanıcı yoksa oluşturulur, varsa şifresi güncellenir.
- `--promote` verilirse kullanıcı yalnızca `role='admin'` yapılır (şifreye dokunulmaz).
- Script, `DATABASE_URL`/`.env` üzerinden app ayarlarını kullanır; alembic çalıştırmadan
  önce şemanın güncel olması gerekir (`alembic upgrade head`).
"""
from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

# Scripts/backend kök dizinini import yoluna ekle.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models import User  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Admin hesabı oluştur veya mevcut kullanıcıyı admin yap.",
    )
    parser.add_argument("--email", required=True, help="Admin e-posta adresi")
    parser.add_argument(
        "--password",
        default=None,
        help="Şifre (verilmezse gizli sorar; --promote ile opsiyoneldir)",
    )
    parser.add_argument(
        "--first-name",
        default="Yönetici",
        help="Yeni kullanıcı için ad (varsayılan: Yönetici)",
    )
    parser.add_argument(
        "--last-name",
        default="Ahicadde",
        help="Yeni kullanıcı için soyad (varsayılan: Ahicadde)",
    )
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Şifre güncellemeden yalnızca rolü admin yap",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    if not email:
        print("Hata: geçerli bir e-posta gerekli.")
        return 1

    password = args.password
    if password is None and not args.promote:
        password = getpass.getpass("Şifre (gizli): ")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))

        if user is None:
            if not password:
                print(
                    f"Hata: {email} kayıtlı değil; yeni hesap için --password gerekli."
                )
                return 1

            user = User(
                email=email,
                password_hash=hash_password(password),
                first_name=args.first_name,
                last_name=args.last_name,
                role="admin",
                is_active=True,
            )
            db.add(user)
            action = "oluşturuldu"
        else:
            user.role = "admin"
            user.is_active = True
            if password:
                user.password_hash = hash_password(password)
                action = "şifresi güncellendi ve admin yapıldı"
            else:
                action = "admin yapıldı"

        db.commit()

        print(f"Tamam: {email} {action}. (role={user.role}, id={user.id})")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
