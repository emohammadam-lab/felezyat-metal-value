import uuid
from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="seller", foreign_keys="Shipment.seller_id", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    withdrawals = relationship("WithdrawalRequest", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String(255), default="")
    phone = Column(String(50), default="")
    national_id = Column(String(20), default="")
    iban_sheba = Column(String(50), default="")
    bank_card = Column(String(30), default="")
    default_address = Column(Text, default="")
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # seller, expert, admin
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="roles")


class PricingConfig(Base):
    __tablename__ = "pricing_config"

    id = Column(Integer, primary_key=True, default=1)
    copper_price_usd = Column(Float, default=9.50, nullable=False)
    usd_rate = Column(BigInteger, default=900000, nullable=False)  # in Rials
    fee_percent = Column(Float, default=3.00, nullable=False)
    deduction_percent = Column(Float, default=2.00, nullable=False)
    logo_dark_url = Column(String(255), default="/logo-dark.png", nullable=True)
    logo_light_url = Column(String(255), default="/logo-light.png", nullable=True)
    favicon_url = Column(String(255), default="/favicon.ico", nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), default="")
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    seller_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expert_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scrap_type = Column(String(50), nullable=False)  # coated_cable, burnt, shavings, body, other
    estimated_weight = Column(Float, nullable=False)
    purity_percent = Column(Float, default=90.0, nullable=False)
    final_weight = Column(Float, nullable=True)
    final_purity_percent = Column(Float, nullable=True)
    deduction_percent = Column(Float, nullable=True)
    photos_json = Column(Text, default="[]", nullable=False)
    address = Column(Text, nullable=False)
    description = Column(Text, default="")
    estimated_price = Column(BigInteger, default=0, nullable=False)
    final_price = Column(BigInteger, nullable=True)
    status = Column(String(30), default="awaiting_expert", nullable=False, index=True)
    # registered, awaiting_expert, price_offered, seller_approved, weighed, settled, rejected
    expert_notes = Column(Text, default="")
    reject_reason = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    seller = relationship("User", foreign_keys=[seller_id], back_populates="shipments")
    expert = relationship("User", foreign_keys=[expert_id])

    @property
    def photos(self):
        try:
            return json.loads(self.photos_json or "[]")
        except Exception:
            return []

    @photos.setter
    def photos(self, val):
        self.photos_json = json.dumps(val or [])


class Wallet(Base):
    __tablename__ = "wallets"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    balance = Column(BigInteger, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="wallet")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shipment_id = Column(String(36), ForeignKey("shipments.id", ondelete="SET NULL"), nullable=True)
    withdrawal_id = Column(String(36), ForeignKey("withdrawal_requests.id", ondelete="SET NULL"), nullable=True)
    amount = Column(BigInteger, nullable=False)
    type = Column(String(20), nullable=False)  # credit, debit, hold, release
    description = Column(Text, default="")
    reference_code = Column(String(100), default="")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="transactions")
    shipment = relationship("Shipment")
    withdrawal = relationship("WithdrawalRequest")


class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)
    iban_sheba = Column(String(50), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    admin_note = Column(Text, default="")
    tracking_code = Column(String(100), default="")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="withdrawals")

