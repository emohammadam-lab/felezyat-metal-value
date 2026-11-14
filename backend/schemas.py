from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------- Auth & User ----------------
class SignUpRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: Optional[str] = ""
    phone: Optional[str] = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    user_id: str
    full_name: str
    phone: str
    national_id: str
    iban_sheba: str
    bank_card: str
    default_address: str
    verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    roles: List[str]
    created_at: datetime
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    iban_sheba: Optional[str] = None
    bank_card: Optional[str] = None
    default_address: Optional[str] = None


# ---------------- Pricing ----------------
class PricingResponse(BaseModel):
    id: int
    copper_price_usd: float
    usd_rate: int
    fee_percent: float
    deduction_percent: float
    logo_dark_url: Optional[str] = "/logo-dark.png"
    logo_light_url: Optional[str] = "/logo-light.png"
    favicon_url: Optional[str] = "/favicon.ico"
    updated_at: datetime

    class Config:
        from_attributes = True


class PricingUpdateRequest(BaseModel):
    copper_price_usd: float
    usd_rate: int
    fee_percent: float
    deduction_percent: float
    logo_dark_url: Optional[str] = None
    logo_light_url: Optional[str] = None
    favicon_url: Optional[str] = None


# ---------------- Shipment ----------------
class ShipmentCreate(BaseModel):
    scrap_type: str
    estimated_weight: float
    purity_percent: float = 90.0
    address: str
    description: Optional[str] = ""
    photos: List[str] = []


class ShipmentResponse(BaseModel):
    id: str
    seller_id: str
    expert_id: Optional[str] = None
    scrap_type: str
    estimated_weight: float
    purity_percent: float
    final_weight: Optional[float] = None
    final_purity_percent: Optional[float] = None
    deduction_percent: Optional[float] = None
    photos: List[str] = []
    address: str
    description: Optional[str] = ""
    estimated_price: int
    final_price: Optional[int] = None
    status: str
    expert_notes: Optional[str] = ""
    reject_reason: Optional[str] = ""
    created_at: datetime
    updated_at: datetime

    seller_name: Optional[str] = None
    seller_phone: Optional[str] = None
    seller_email: Optional[str] = None

    class Config:
        from_attributes = True


class ExpertValuationRequest(BaseModel):
    final_purity_percent: float
    deduction_percent: float
    expert_notes: Optional[str] = ""


class ExpertWeighRequest(BaseModel):
    final_weight: float
    expert_notes: Optional[str] = ""


class ShipmentRejectRequest(BaseModel):
    reason: str


# ---------------- Wallet & Transactions ----------------
class WalletResponse(BaseModel):
    balance: int
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    shipment_id: Optional[str] = None
    withdrawal_id: Optional[str] = None
    amount: int
    type: str
    description: Optional[str] = ""
    reference_code: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True


class WithdrawalCreateRequest(BaseModel):
    amount: int = Field(gt=0)
    iban_sheba: str


class WithdrawalResponse(BaseModel):
    id: str
    user_id: str
    amount: int
    iban_sheba: str
    status: str
    admin_note: Optional[str] = ""
    tracking_code: Optional[str] = ""
    created_at: datetime
    processed_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None

    class Config:
        from_attributes = True


class WithdrawalProcessRequest(BaseModel):
    status: str  # approved, rejected
    tracking_code: Optional[str] = ""
    admin_note: Optional[str] = ""


class WalletAdjustRequest(BaseModel):
    user_id: str
    amount: int  # positive for credit, negative for debit
    description: str


# ---------------- Admin ----------------
class AdminStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    total_shipments: int
    pending_expert_shipments: int
    ready_settle_shipments: int
    pending_withdrawals: int
    total_volume_settled: int
    total_weight_settled: float


class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    iban_sheba: Optional[str] = None
    bank_card: Optional[str] = None
    default_address: Optional[str] = None
    verified: Optional[bool] = None
    is_active: Optional[bool] = None


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: Optional[str] = ""
    phone: Optional[str] = ""
    roles: List[str] = ["seller"]


class AdminRoleToggleRequest(BaseModel):
    role: str
