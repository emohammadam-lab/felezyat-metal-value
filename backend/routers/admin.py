from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models import (
    User,
    Profile,
    UserRole,
    Shipment,
    Wallet,
    WithdrawalRequest,
)
from backend.schemas import (
    AdminStatsResponse,
    UserResponse,
    UserProfileResponse,
    AdminUserUpdateRequest,
    AdminCreateUserRequest,
    AdminRoleToggleRequest,
)
from backend.auth import require_role, hash_password, get_user_roles

router = APIRouter(prefix="/api/admin", tags=["admin"])


def user_to_full_response(u: User) -> UserResponse:
    profile_resp = None
    if u.profile:
        profile_resp = UserProfileResponse.model_validate(u.profile)
    return UserResponse(
        id=u.id,
        email=u.email,
        is_active=u.is_active,
        roles=get_user_roles(u),
        created_at=u.created_at,
        profile=profile_resp,
    )


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    verified_users = db.query(func.count(Profile.user_id)).filter(Profile.verified == True).scalar() or 0
    total_shipments = db.query(func.count(Shipment.id)).scalar() or 0
    pending_expert = db.query(func.count(Shipment.id)).filter(Shipment.status == "awaiting_expert").scalar() or 0
    ready_settle = db.query(func.count(Shipment.id)).filter(Shipment.status == "weighed").scalar() or 0
    pending_withdrawals = db.query(func.count(WithdrawalRequest.id)).filter(WithdrawalRequest.status == "pending").scalar() or 0

    settled_shipments = db.query(Shipment).filter(Shipment.status == "settled").all()
    total_volume = sum([s.final_price or 0 for s in settled_shipments])
    total_weight = sum([s.final_weight or s.estimated_weight or 0.0 for s in settled_shipments])

    return AdminStatsResponse(
        total_users=total_users,
        verified_users=verified_users,
        total_shipments=total_shipments,
        pending_expert_shipments=pending_expert,
        ready_settle_shipments=ready_settle,
        pending_withdrawals=pending_withdrawals,
        total_volume_settled=total_volume,
        total_weight_settled=round(total_weight, 2),
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    query = db.query(User).outerjoin(User.profile)

    if role and role != "all":
        query = query.join(User.roles).filter(UserRole.role == role)

    if verified is not None:
        query = query.filter(Profile.verified == verified)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term))
            | (Profile.full_name.ilike(search_term))
            | (Profile.phone.ilike(search_term))
            | (Profile.national_id.ilike(search_term))
        )

    users = query.order_by(User.created_at.desc()).all()
    return [user_to_full_response(u) for u in users]


@router.post("/users", response_model=UserResponse)
def create_user_by_admin(
    req: AdminCreateUserRequest,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="این ایمیل قبلا ثبت شده است.")

    new_user = User(
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    profile = Profile(
        user_id=new_user.id,
        full_name=req.full_name or "",
        phone=req.phone or "",
    )
    db.add(profile)

    wallet = Wallet(user_id=new_user.id, balance=0)
    db.add(wallet)

    roles_to_add = req.roles if req.roles else ["seller"]
    for r in roles_to_add:
        db.add(UserRole(user_id=new_user.id, role=r))

    db.commit()
    db.refresh(new_user)
    return user_to_full_response(new_user)


@router.put("/users/{id}", response_model=UserResponse)
def update_user_by_admin(
    id: str,
    req: AdminUserUpdateRequest,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

    if req.is_active is not None:
        target.is_active = req.is_active

    profile = db.query(Profile).filter(Profile.user_id == id).first()
    if not profile:
        profile = Profile(user_id=id)
        db.add(profile)

    if req.full_name is not None:
        profile.full_name = req.full_name.strip()
    if req.phone is not None:
        profile.phone = req.phone.strip()
    if req.national_id is not None:
        profile.national_id = req.national_id.strip()
    if req.iban_sheba is not None:
        profile.iban_sheba = req.iban_sheba.strip().upper()
    if req.bank_card is not None:
        profile.bank_card = req.bank_card.strip()
    if req.default_address is not None:
        profile.default_address = req.default_address.strip()
    if req.verified is not None:
        profile.verified = req.verified

    db.commit()
    db.refresh(target)
    return user_to_full_response(target)


@router.post("/users/{id}/roles", response_model=UserResponse)
def toggle_user_role(
    id: str,
    req: AdminRoleToggleRequest,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

    if req.role not in ["seller", "expert", "admin"]:
        raise HTTPException(status_code=400, detail="نقش نامعتبر است.")

    existing_role = db.query(UserRole).filter(UserRole.user_id == id, UserRole.role == req.role).first()
    if existing_role:
        # Don't allow removing admin from oneself
        if target.id == admin.id and req.role == "admin":
            raise HTTPException(status_code=400, detail="شما نمی‌توانید نقش مدیر را از خود سلب کنید.")
        db.delete(existing_role)
    else:
        db.add(UserRole(user_id=id, role=req.role))

    db.commit()
    db.refresh(target)
    return user_to_full_response(target)


@router.delete("/users/{id}")
def delete_user(
    id: str,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    if id == admin.id:
        raise HTTPException(status_code=400, detail="حذف حساب جاری توسط خود کاربر مجاز نیست.")

    target = db.query(User).filter(User.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

    db.delete(target)
    db.commit()
    return {"message": "کاربر با موفقیت حذف شد."}

