import re
from typing import Literal
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

SellerType = Literal["individual", "sole_proprietor", "company", "producer_coop"]
ProductCountRange = Literal["1-10", "11-50", "51-200", "200+"]


class SellerApplicationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=32)
    city: str = Field(min_length=2, max_length=80)

    seller_type: SellerType
    business_name: str | None = Field(default=None, max_length=160)
    tax_number: str | None = Field(default=None, max_length=11)
    website_or_social: str | None = Field(default=None, max_length=255)

    product_category: str = Field(min_length=2, max_length=80)
    product_description: str = Field(min_length=20, max_length=2000)
    estimated_product_count: ProductCountRange

    kvkk_consent: bool
    # Honeypot: gerçek kullanıcılar boş bırakır, botlar doldurur
    website_url_hp: str | None = Field(default=None, max_length=255)

    @field_validator("full_name", "city", "product_category", "product_description")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if not 10 <= len(digits) <= 13:
            raise ValueError("Geçerli bir telefon numarası girin.")
        return digits

    @field_validator("tax_number")
    @classmethod
    def validate_tax_number(cls, v: str | None) -> str | None:
        if not v:
            return None
        if not re.fullmatch(r"\d{10}|\d{11}", v):
            raise ValueError("Vergi no 10 haneli, TC kimlik no 11 haneli olmalıdır.")
        return v

    @model_validator(mode="after")
    def check_business_fields(self):
        if self.seller_type in ("sole_proprietor", "company", "producer_coop"):
            if not self.business_name:
                raise ValueError("İşletme adı zorunludur.")
        if not self.kvkk_consent:
            raise ValueError("KVKK aydınlatma metnini onaylamanız gerekir.")
        return self


class SellerApplicationOut(BaseModel):
    id: int
    status: str

    model_config = {"from_attributes": True}


class SellerApplicationAdminOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: EmailStr
    phone: str
    city: str
    seller_type: str
    business_name: str | None
    tax_number: str | None
    website_or_social: str | None
    product_category: str
    product_description: str
    estimated_product_count: str
    status: Literal["pending", "approved", "rejected"]
    created_at: datetime

    model_config = {"from_attributes": True}
