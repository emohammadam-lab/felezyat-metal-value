from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Profile, UserRole, Wallet
from backend.schemas import (
    SignUpRequest,
    LoginRequest,
    ChangePasswordRequest,
    TokenResponse,
    UserResponse,
    UserProfileResponse,
)
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_user_roles,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    profile_resp = None
    if user.profile:
        profile_resp = UserProfileResponse.model_validate(user.profile)
    return UserResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        roles=get_user_roles(user),
        created_at=user.created_at,
        profile=profile_resp,
    )


@router.post("/signup", response_model=TokenResponse)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ایمیل وارد شده قبلا در سیستم ثبت شده است.",
        )

    user = User(
        email=req.email.lower(),
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        full_name=req.full_name or "",
        phone=req.phone or "",
    )
    role = UserRole(user_id=user.id, role="seller")
    wallet = Wallet(user_id=user.id, balance=0)

    db.add_all([profile, role, wallet])
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ایمیل یا رمز عبور اشتباه است.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="حساب کاربری شما غیرفعال شده است. با پشتیبانی تماس بگیرید.",
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user_to_response(user)


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور فعلی نادرست است.",
        )
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "رمز عبور با موفقیت تغییر کرد."}

