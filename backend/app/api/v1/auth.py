import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy import update as sa_update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import get_client_ip, limiter, rate_limit
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models import User, RefreshToken
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.email import email_service

logger = logging.getLogger("ahicadde.auth")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

RATE_LIMIT_LOGIN_PER_MINUTE = 10
RATE_LIMIT_LOGIN_EMAIL_PER_MINUTE = 5
RATE_LIMIT_REGISTER_PER_MINUTE = 5
RATE_LIMIT_FORGOT_IP_PER_MINUTE = 5
RATE_LIMIT_FORGOT_EMAIL_PER_MINUTE = 3
RATE_LIMIT_RESET_PER_MINUTE = 5
RATE_LIMIT_VERIFY_PER_MINUTE = 10
RATE_LIMIT_SEND_VERIFICATION_PER_MINUTE = 5
RATE_LIMIT_REFRESH_PER_MINUTE = 30
RATE_LIMIT_CHANGE_PASSWORD_PER_MINUTE = 5

REFRESH_COOKIE = "refresh_token"
# Cookie yalnizca yenileme/cikis ucina gonderilir; diger isteklere sizmaz.
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _issue_token(user: User, purpose: str) -> str:
    """Tek kullanilikli token uretir; DB'ye sha256 ozeti + son gecerlilik yazar."""
    token = secrets.token_urlsafe(32)
    hashed = _hash_token(token)
    now = datetime.utcnow()

    if purpose == "verification":
        user.verification_token = hashed
        user.verification_token_expires = now + timedelta(
            hours=settings.email_verification_expire_hours,
        )
    else:
        user.reset_token = hashed
        user.reset_token_expires = now + timedelta(
            minutes=settings.password_reset_expire_minutes,
        )

    return token


def _send_verification_email(user: User, token: str) -> None:
    link = f"{settings.frontend_url}/email-dogrula?token={token}"
    email_service.send(
        to=user.email,
        subject="Ahicadde - E-posta doğrulama",
        body=(
            "Merhaba,\n\n"
            "Ahicadde hesabınızı doğrulamak için aşağıdaki bağlantıyı kullanın "
            f"({settings.email_verification_expire_hours} saat geçerli):\n\n"
            f"{link}\n\n"
            "Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz."
        ),
    )


def _set_session_cookies(response: Response, access_token: str) -> None:
    """Erisim + yenileme cookie'lerini ayarlar (yenileme cookie'si dar path'li)."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )


def _issue_refresh_session(db: Session, user: User, response: Response) -> None:
    """Yeni refresh token uretir (DB'de sha256 ozeti) ve cookie olarak yazar."""
    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(
        days=settings.refresh_token_expire_days,
    )

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=expires_at,
        )
    )
    db.commit()

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=raw_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
    )


def _revoke_all_refresh_tokens(db: Session, user_id: int) -> None:
    """Kullanicinin tum aktif yenileme tokenlarini iptal eder."""
    now = datetime.utcnow()

    db.execute(
        sa_update(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )


def _find_active_refresh_token(db: Session, raw_token: str) -> RefreshToken | None:
    return db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == _hash_token(raw_token),
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.utcnow(),
        )
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(
            rate_limit(
                scope="register",
                limit=RATE_LIMIT_REGISTER_PER_MINUTE,
                window_seconds=60,
            ),
        ),
    ],
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = data.email.lower().strip()

    existing_user = db.scalar(select(User).where(User.email == email))

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu eposta zaten kayıtlı",
        )

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        role="customer",
        is_active=True,
        is_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Dogrulama e-postasi gonderimi kayit basarisini bozmasin; token yine de
    # DB'de olusur, kullanici hesabim sayfasindan yeniden isteyebilir.
    try:
        token = _issue_token(user, "verification")
        db.commit()
        _send_verification_email(user, token)
    except Exception:
        logger.exception("Dogrulama e-postasi gonderilemedi (kayit: %s)", email)

    return user


@router.post("/login")
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    limiter.check(
        f"login:{get_client_ip(request)}",
        RATE_LIMIT_LOGIN_PER_MINUTE,
        60,
    )

    email = data.email.lower().strip()

    limiter.check(
        f"login:email:{email}",
        RATE_LIMIT_LOGIN_EMAIL_PER_MINUTE,
        60,
    )

    user = db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kullanıcı hesabı aktif değil",
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    _set_session_cookies(response, token)

    # Uzun omurlu oturum: erisim tokeni 30 dk, yenileme tokeni N gun.
    # Erisim tokeni doldugunda istemci /auth/refresh ile sessizce devam eder.
    _issue_refresh_session(db, user, response)

    return {
        "message": "Giriş başarılı",
        "user": UserResponse.model_validate(user),
    }


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if refresh_token:
        token_row = db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == _hash_token(refresh_token),
                RefreshToken.revoked_at.is_(None),
            )
        )

        if token_row is not None:
            token_row.revoked_at = datetime.utcnow()
            db.commit()

    response.delete_cookie(
        key="access_token",
    )

    response.delete_cookie(
        key=REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
    )

    return {
        "message": "Çıkış başarılı",
    }


@router.post("/refresh")
def refresh_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    """Erisim tokeni doldugunda sessiz oturum yenileme (token rotasyonlu).

    Kullanilan yenileme tokeni iptal edilir ve yenisini uretilir; boylece
    calinan bir token tek kullanima mahsus kalir.
    """
    limiter.check(
        f"refresh:{get_client_ip(request)}",
        RATE_LIMIT_REFRESH_PER_MINUTE,
        60,
    )

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum yenileme bilgisi bulunamadı.",
        )

    token_row = _find_active_refresh_token(db, refresh_token)

    if token_row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
        )

    user = db.get(User, token_row.user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı veya hesap aktif değil.",
        )

    # Rotasyon: eski tokeni iptal et, yenisini uret.
    token_row.revoked_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    _set_session_cookies(response, access_token)
    _issue_refresh_session(db, user, response)

    return {
        "message": "Oturum yenilendi",
        "user": UserResponse.model_validate(user),
    }


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = decode_access_token(access_token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


@router.post(
    "/change-password",
    response_model=MessageResponse,
    dependencies=[
        Depends(
            rate_limit(
                scope="change-password",
                limit=RATE_LIMIT_CHANGE_PASSWORD_PER_MINUTE,
                window_seconds=60,
            ),
        ),
    ],
)
def change_password(
    data: ChangePasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifreniz hatalı.",
        )

    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yeni şifre mevcut şifreyle aynı olamaz.",
        )

    current_user.password_hash = hash_password(data.new_password)

    # Sifre degisince diger tum oturumlar (yenileme tokenlari) iptal edilir;
    # bu istemde yeni tokenlar uretilerek mevcut oturum saglikli kalir.
    _revoke_all_refresh_tokens(db, current_user.id)
    db.commit()

    access_token = create_access_token(
        user_id=current_user.id,
        role=current_user.role,
    )

    _set_session_cookies(response, access_token)
    _issue_refresh_session(db, current_user, response)

    try:
        email_service.send(
            to=current_user.email,
            subject="Ahicadde - Şifreniz değiştirildi",
            body=(
                "Merhaba,\n\n"
                "Ahicadde hesabınızın şifresi az önce değiştirildi.\n\n"
                "Bu değişikliği siz yapmadıysanız derhal "
                "'Şifremi unuttum' akışıyla şifrenizi sıfırlayın ve "
                "hesabınızı kontrol edin."
            ),
        )
    except Exception:
        logger.exception(
            "Sifre degisikligi e-postasi gonderilemedi (%s)",
            current_user.email,
        )

    return {
        "message": "Şifreniz güncellendi. Diğer oturumlarınız kapatıldı.",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


@router.get("/admin-test")
def admin_test(
    current_user: User = Depends(require_admin),
):
    return {
        "message": "Admin access granted",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    limiter.check(
        f"forgot-password:{get_client_ip(request)}",
        RATE_LIMIT_FORGOT_IP_PER_MINUTE,
        60,
    )

    email = data.email.lower().strip()

    limiter.check(
        f"forgot-password:email:{email}",
        RATE_LIMIT_FORGOT_EMAIL_PER_MINUTE,
        60,
    )

    user = db.scalar(select(User).where(User.email == email))

    # Kullanici varligi belirtilmez (enumeration onlemi); yanit her durumda aynidir.
    if user is not None and user.is_active:
        token = _issue_token(user, "reset")
        db.commit()

        link = f"{settings.frontend_url}/sifre-sifirla?token={token}"

        try:
            email_service.send(
                to=user.email,
                subject="Ahicadde - Şifre sıfırlama",
                body=(
                    "Merhaba,\n\n"
                    "Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın "
                    f"({settings.password_reset_expire_minutes} dakika geçerli):\n\n"
                    f"{link}\n\n"
                    "Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; "
                    "şifreniz değişmeden kalacaktır."
                ),
            )
        except Exception:
            logger.exception("Sifre sifirlama e-postasi gonderilemedi (%s)", email)

    return {
        "message": "E-posta adresinizi kontrol edin. Hesabınız varsa şifre "
        "sıfırlama bağlantısı gönderildi.",
    }


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    dependencies=[
        Depends(
            rate_limit(
                scope="reset-password",
                limit=RATE_LIMIT_RESET_PER_MINUTE,
                window_seconds=60,
            ),
        ),
    ],
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    hashed = _hash_token(data.token)

    user = db.scalar(
        select(User).where(
            User.reset_token == hashed,
            User.reset_token_expires > datetime.utcnow(),
        ),
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.",
        )

    user.password_hash = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None

    # Sifre sifirlama, calinan olasi oturumlari da dusurur.
    _revoke_all_refresh_tokens(db, user.id)
    db.commit()

    return {
        "message": "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
    }


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    dependencies=[
        Depends(
            rate_limit(
                scope="verify-email",
                limit=RATE_LIMIT_VERIFY_PER_MINUTE,
                window_seconds=60,
            ),
        ),
    ],
)
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    hashed = _hash_token(data.token)

    user = db.scalar(
        select(User).where(
            User.verification_token == hashed,
            User.verification_token_expires > datetime.utcnow(),
        ),
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doğrulama bağlantısı geçersiz veya süresi dolmuş.",
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    return {
        "message": "E-posta adresiniz doğrulandı. Artık tüm özellikleri kullanabilirsiniz.",
    }


@router.post(
    "/send-verification",
    response_model=MessageResponse,
    dependencies=[
        Depends(
            rate_limit(
                scope="send-verification",
                limit=RATE_LIMIT_SEND_VERIFICATION_PER_MINUTE,
                window_seconds=60,
            ),
        ),
    ],
)
def send_verification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-posta adresiniz zaten doğrulanmış.",
        )

    token = _issue_token(current_user, "verification")
    db.commit()
    _send_verification_email(current_user, token)

    return {
        "message": "Doğrulama e-postası gönderildi. E-postanızı kontrol edin.",
    }
