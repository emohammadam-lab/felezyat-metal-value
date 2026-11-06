import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Wallet, Transaction, WithdrawalRequest, User
from backend.schemas import (
    WalletResponse,
    TransactionResponse,
    WithdrawalCreateRequest,
    WithdrawalResponse,
    WithdrawalProcessRequest,
    WalletAdjustRequest,
)
from backend.auth import get_current_user, require_role, get_user_roles

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


def withdrawal_to_response(w: WithdrawalRequest) -> WithdrawalResponse:
    resp = WithdrawalResponse(
        id=w.id,
        user_id=w.user_id,
        amount=w.amount,
        iban_sheba=w.iban_sheba,
        status=w.status,
        admin_note=w.admin_note or "",
        tracking_code=w.tracking_code or "",
        created_at=w.created_at,
        processed_at=w.processed_at,
    )
    if w.user:
        if w.user.profile:
            resp.user_name = w.user.profile.full_name
            resp.user_phone = w.user.profile.phone
        else:
            resp.user_name = w.user.email
    return resp


@router.get("", response_model=WalletResponse)
def get_my_wallet(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        wallet = Wallet(user_id=user.id, balance=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    user_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = get_user_roles(user)
    query = db.query(Transaction)

    if "admin" in roles:
        if user_id:
            query = query.filter(Transaction.user_id == user_id)
    else:
        query = query.filter(Transaction.user_id == user.id)

    query = query.order_by(Transaction.created_at.desc()).limit(100)
    return query.all()


@router.post("/withdrawals", response_model=WithdrawalResponse)
def request_withdrawal(
    req: WithdrawalCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet or wallet.balance < req.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="موجودی کیف پول برای این درخواست برداشت کافی نیست.",
        )

    # Clean sheba
    sheba = req.iban_sheba.strip().upper()
    if not sheba.startswith("IR") or len(sheba) < 24:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شماره شبا نامعتبر است. شماره شبا باید با IR شروع شود.",
        )

    # Deduct balance upfront (or hold)
    wallet.balance -= req.amount

    withdrawal = WithdrawalRequest(
        user_id=user.id,
        amount=req.amount,
        iban_sheba=sheba,
        status="pending",
    )
    db.add(withdrawal)
    db.flush()

    # Create hold/debit transaction
    ref = f"WD-{uuid.uuid4().hex[:8].upper()}"
    tx = Transaction(
        user_id=user.id,
        withdrawal_id=withdrawal.id,
        amount=req.amount,
        type="debit",
        description=f"درخواست تسویه بانکی به شبا {sheba}",
        reference_code=ref,
    )
    db.add(tx)

    db.commit()
    db.refresh(withdrawal)
    return withdrawal_to_response(withdrawal)


@router.get("/withdrawals", response_model=List[WithdrawalResponse])
def list_withdrawals(
    status_filter: Optional[str] = Query(None, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = get_user_roles(user)
    query = db.query(WithdrawalRequest)

    if "admin" not in roles:
        query = query.filter(WithdrawalRequest.user_id == user.id)

    if status_filter and status_filter != "all":
        query = query.filter(WithdrawalRequest.status == status_filter)

    query = query.order_by(WithdrawalRequest.created_at.desc())
    items = query.all()
    return [withdrawal_to_response(w) for w in items]


@router.post("/withdrawals/{id}/process", response_model=WithdrawalResponse)
def process_withdrawal(
    id: str,
    req: WithdrawalProcessRequest,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    withdrawal = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == id).first()
    if not withdrawal:
        raise HTTPException(status_code=404, detail="درخواست برداشت یافت نشد.")
    if withdrawal.status != "pending":
        raise HTTPException(status_code=400, detail="این درخواست قبلا تعیین وضعیت شده است.")

    if req.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="وضعیت باید تایید شده یا رد شده باشد.")

    withdrawal.status = req.status
    withdrawal.admin_note = req.admin_note or ""
    withdrawal.tracking_code = req.tracking_code or ""
    withdrawal.processed_at = datetime.now(timezone.utc)

    if req.status == "rejected":
        # Refund the amount back to user's wallet
        wallet = db.query(Wallet).filter(Wallet.user_id == withdrawal.user_id).first()
        if wallet:
            wallet.balance += withdrawal.amount
            ref = f"REFUND-{uuid.uuid4().hex[:8].upper()}"
            refund_tx = Transaction(
                user_id=withdrawal.user_id,
                withdrawal_id=withdrawal.id,
                amount=withdrawal.amount,
                type="credit",
                description=f"استرداد وجه برداشت رد شده ({req.admin_note or 'علت نامشخص'})",
                reference_code=ref,
            )
            db.add(refund_tx)

    db.commit()
    db.refresh(withdrawal)
    return withdrawal_to_response(withdrawal)


@router.post("/adjust")
def adjust_wallet(
    req: WalletAdjustRequest,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

    wallet = db.query(Wallet).filter(Wallet.user_id == req.user_id).first()
    if not wallet:
        wallet = Wallet(user_id=req.user_id, balance=0)
        db.add(wallet)
        db.flush()

    if req.amount < 0 and wallet.balance < abs(req.amount):
        raise HTTPException(status_code=400, detail="موجودی کاربر برای کسر این مبلغ کافی نیست.")

    wallet.balance += req.amount
    tx_type = "credit" if req.amount >= 0 else "debit"
    ref = f"ADJ-{uuid.uuid4().hex[:8].upper()}"

    tx = Transaction(
        user_id=req.user_id,
        amount=abs(req.amount),
        type=tx_type,
        description=f"تعدیل موجودی توسط مدیر: {req.description}",
        reference_code=ref,
    )
    db.add(tx)
    db.commit()

    return {"message": "موجودی با موفقیت اصلاح شد.", "new_balance": wallet.balance}

