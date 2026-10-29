from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_admin
from app.db.session import get_db
from app.models.seller_application import SellerApplication
from app.models.user import User
from app.schemas.seller_application import (
    SellerApplicationAdminOut,
    SellerApplicationCreate,
    SellerApplicationOut,
)

router = APIRouter(
    prefix="/seller-applications",
    tags=["seller-applications"],
)


@router.post(
    "",
    response_model=SellerApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_seller_application(
    payload: SellerApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Honeypot doluysa başvuruyu kaydetme.
    if payload.website_url_hp:
        return SellerApplicationOut(id=0, status="pending")

    existing = db.scalar(
        select(SellerApplication).where(
            SellerApplication.user_id == current_user.id,
            SellerApplication.status == "pending",
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bekleyen bir satıcı başvurunuz zaten var.",
        )

    data = payload.model_dump(exclude={"website_url_hp", "email"})

    application = SellerApplication(
        **data,
        user_id=current_user.id,
        email=current_user.email.lower(),
        status="pending",
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@router.get(
    "/mine",
    response_model=list[SellerApplicationAdminOut],
)
def get_my_seller_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    applications = db.scalars(
        select(SellerApplication)
        .where(SellerApplication.user_id == current_user.id)
        .order_by(SellerApplication.created_at.desc())
    ).all()

    return applications


@router.get(
    "/admin",
    response_model=list[SellerApplicationAdminOut],
)
def list_seller_applications(
    application_status: Literal["pending", "approved", "rejected"] | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(SellerApplication).order_by(SellerApplication.created_at.desc())

    if application_status:
        query = query.where(SellerApplication.status == application_status)

    return db.scalars(query).all()


@router.patch(
    "/admin/{application_id}/approve",
    response_model=SellerApplicationAdminOut,
)
def approve_seller_application(
    application_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    application = db.get(SellerApplication, application_id)

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Satıcı başvurusu bulunamadı.",
        )

    if application.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Yalnızca bekleyen başvurular onaylanabilir.",
        )

    application.status = "approved"
    db.commit()
    db.refresh(application)

    return application


@router.patch(
    "/admin/{application_id}/reject",
    response_model=SellerApplicationAdminOut,
)
def reject_seller_application(
    application_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    application = db.get(SellerApplication, application_id)

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Satıcı başvurusu bulunamadı.",
        )

    if application.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Yalnızca bekleyen başvurular reddedilebilir.",
        )

    application.status = "rejected"
    db.commit()
    db.refresh(application)

    return application
