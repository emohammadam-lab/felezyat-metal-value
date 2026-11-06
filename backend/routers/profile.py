from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Profile
from backend.schemas import UserProfileResponse, ProfileUpdateRequest
from backend.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=UserProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("", response_model=UserProfileResponse)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
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

    db.commit()
    db.refresh(profile)
    return profile

