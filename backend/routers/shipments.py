import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Shipment, User, PricingConfig, Wallet, Transaction, Profile
from backend.schemas import (
    ShipmentCreate,
    ShipmentResponse,
    ExpertValuationRequest,
    ExpertWeighRequest,
    ShipmentRejectRequest,
)
from backend.auth import get_current_user, require_role, get_user_roles

router = APIRouter(prefix="/api/shipments", tags=["shipments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "shipment-photos")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def calculate_price(
    weight_kg: float,
    purity_percent: float,
    copper_usd: float,
    usd_rate_rial: int,
    fee_percent: float,
    deduction_percent: float,
) -> int:
    usd_rate_toman = usd_rate_rial / 10.0
    gross = weight_kg * copper_usd * usd_rate_toman * (purity_percent / 100.0)
    after_deduction = gross * (1.0 - (deduction_percent / 100.0))
    after_fee = after_deduction * (1.0 - (fee_percent / 100.0))
    return max(0, round(after_fee))


def shipment_to_response(s: Shipment, db: Session) -> ShipmentResponse:
    resp = ShipmentResponse(
        id=s.id,
        seller_id=s.seller_id,
        expert_id=s.expert_id,
        scrap_type=s.scrap_type,
        estimated_weight=s.estimated_weight,
        purity_percent=s.purity_percent,
        final_weight=s.final_weight,
        final_purity_percent=s.final_purity_percent,
        deduction_percent=s.deduction_percent,
        photos=s.photos,
        address=s.address,
        description=s.description or "",
        estimated_price=s.estimated_price,
        final_price=s.final_price,
        status=s.status,
        expert_notes=s.expert_notes or "",
        reject_reason=s.reject_reason or "",
        created_at=s.created_at,
        updated_at=s.updated_at,
    )
    if s.seller:
        resp.seller_email = s.seller.email
        if s.seller.profile:
            resp.seller_name = s.seller.profile.full_name
            resp.seller_phone = s.seller.profile.phone
    return resp


@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="فقط بارگذاری فایل‌های تصویری مجاز است.",
        )

    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    safe_filename = f"{user.id[:8]}_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/shipment-photos/{safe_filename}"}


@router.post("", response_model=ShipmentResponse)
def create_shipment(
    req: ShipmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pricing = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
    if not pricing:
        pricing = PricingConfig(id=1)
        db.add(pricing)
        db.commit()
        db.refresh(pricing)

    estimated_price = calculate_price(
        weight_kg=req.estimated_weight,
        purity_percent=req.purity_percent,
        copper_usd=pricing.copper_price_usd,
        usd_rate_rial=pricing.usd_rate,
        fee_percent=pricing.fee_percent,
        deduction_percent=pricing.deduction_percent,
    )

    shipment = Shipment(
        seller_id=user.id,
        scrap_type=req.scrap_type,
        estimated_weight=req.estimated_weight,
        purity_percent=req.purity_percent,
        address=req.address,
        description=req.description or "",
        photos=req.photos,
        estimated_price=estimated_price,
        status="awaiting_expert",
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    return shipment_to_response(shipment, db)


@router.get("", response_model=List[ShipmentResponse])
def list_shipments(
    status_filter: Optional[str] = Query(None, alias="status"),
    scrap_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = get_user_roles(user)
    query = db.query(Shipment)

    if "admin" in roles:
        # Admin can view all
        pass
    elif "expert" in roles:
        # Expert can view all non-draft
        pass
    else:
        # Regular seller sees only their own
        query = query.filter(Shipment.seller_id == user.id)

    if status_filter and status_filter != "all":
        query = query.filter(Shipment.status == status_filter)

    if scrap_type and scrap_type != "all":
        query = query.filter(Shipment.scrap_type == scrap_type)

    if search:
        search_term = f"%{search}%"
        query = query.join(Shipment.seller).join(User.profile).filter(
            (Shipment.address.ilike(search_term))
            | (Profile.full_name.ilike(search_term))
            | (Profile.phone.ilike(search_term))
            | (User.email.ilike(search_term))
        )

    query = query.order_by(Shipment.created_at.desc())
    items = query.all()
    return [shipment_to_response(s, db) for s in items]


@router.get("/{id}", response_model=ShipmentResponse)
def get_shipment(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")

    roles = get_user_roles(user)
    if "admin" not in roles and "expert" not in roles and shipment.seller_id != user.id:
        raise HTTPException(status_code=403, detail="دسترسی به این محموله مجاز نیست.")

    return shipment_to_response(shipment, db)


@router.post("/{id}/offer", response_model=ShipmentResponse)
def expert_offer_price(
    id: str,
    req: ExpertValuationRequest,
    expert: User = Depends(require_role("expert", "admin")),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")

    pricing = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
    weight = shipment.final_weight or shipment.estimated_weight

    final_price = calculate_price(
        weight_kg=weight,
        purity_percent=req.final_purity_percent,
        copper_usd=pricing.copper_price_usd,
        usd_rate_rial=pricing.usd_rate,
        fee_percent=pricing.fee_percent,
        deduction_percent=req.deduction_percent,
    )

    shipment.expert_id = expert.id
    shipment.final_purity_percent = req.final_purity_percent
    shipment.deduction_percent = req.deduction_percent
    shipment.final_price = final_price
    shipment.expert_notes = req.expert_notes or shipment.expert_notes
    shipment.status = "price_offered"

    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)


@router.post("/{id}/seller-approve", response_model=ShipmentResponse)
def seller_approve(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id, Shipment.seller_id == user.id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")
    if shipment.status != "price_offered":
        raise HTTPException(status_code=400, detail="این سفارش در وضعیت انتظار تایید قیمت نیست.")

    shipment.status = "seller_approved"
    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)


@router.post("/{id}/seller-reject", response_model=ShipmentResponse)
def seller_reject(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id, Shipment.seller_id == user.id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")

    shipment.status = "rejected"
    shipment.reject_reason = "رد شده توسط فروشنده"
    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)


@router.post("/{id}/cancel", response_model=ShipmentResponse)
def cancel_shipment(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id, Shipment.seller_id == user.id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")
    if shipment.status not in ["registered", "awaiting_expert"]:
        raise HTTPException(status_code=400, detail="فقط محموله‌های در انتظار کارشناسی قابل لغو هستند.")

    shipment.status = "rejected"
    shipment.reject_reason = "لغو شده توسط فروشنده"
    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)


@router.post("/{id}/weigh", response_model=ShipmentResponse)
def expert_weigh(
    id: str,
    req: ExpertWeighRequest,
    expert: User = Depends(require_role("expert", "admin")),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")

    pricing = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
    purity = shipment.final_purity_percent or shipment.purity_percent
    deduction = shipment.deduction_percent if shipment.deduction_percent is not None else pricing.deduction_percent

    final_price = calculate_price(
        weight_kg=req.final_weight,
        purity_percent=purity,
        copper_usd=pricing.copper_price_usd,
        usd_rate_rial=pricing.usd_rate,
        fee_percent=pricing.fee_percent,
        deduction_percent=deduction,
    )

    shipment.final_weight = req.final_weight
    shipment.final_price = final_price
    if req.expert_notes:
        shipment.expert_notes = req.expert_notes
    shipment.status = "weighed"

    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)


@router.post("/{id}/reject", response_model=ShipmentResponse)
def expert_reject(
    id: str,
    req: ShipmentRejectRequest,
    expert: User = Depends(require_role("expert", "admin")),
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")

    shipment.status = "rejected"
    shipment.reject_reason = req.reason
    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)


@router.post("/{id}/settle", response_model=ShipmentResponse)
def settle_shipment(
    id: str,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    # Atomic transaction
    shipment = db.query(Shipment).filter(Shipment.id == id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="محموله یافت نشد.")
    if shipment.status == "settled":
        raise HTTPException(status_code=400, detail="این سفارش قبلا تسویه شده است.")
    if shipment.status != "weighed" and not shipment.final_price:
        raise HTTPException(status_code=400, detail="سفارش باید ابتدا توزین و قیمت نهایی مشخص شود.")

    amount = int(shipment.final_price)
    seller_id = shipment.seller_id

    # 1. Update shipment status
    shipment.status = "settled"

    # 2. Update wallet
    wallet = db.query(Wallet).filter(Wallet.user_id == seller_id).first()
    if not wallet:
        wallet = Wallet(user_id=seller_id, balance=0)
        db.add(wallet)
        db.flush()

    wallet.balance += amount

    # 3. Create transaction record
    ref_code = f"SETTLE-{uuid.uuid4().hex[:8].upper()}"
    tx = Transaction(
        user_id=seller_id,
        shipment_id=shipment.id,
        amount=amount,
        type="credit",
        description=f"تسویه محموله مس ({shipment.scrap_type}) - وزن {shipment.final_weight or shipment.estimated_weight} کیلوگرم",
        reference_code=ref_code,
    )
    db.add(tx)

    db.commit()
    db.refresh(shipment)
    return shipment_to_response(shipment, db)

