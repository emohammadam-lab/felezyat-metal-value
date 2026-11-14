from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import PricingConfig, User
from backend.schemas import PricingResponse, PricingUpdateRequest
from backend.auth import require_role

router = APIRouter(prefix="/api/pricing", tags=["pricing"])


@router.get("", response_model=PricingResponse)
def get_pricing(db: Session = Depends(get_db)):
    config = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
    if not config:
        config = PricingConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("", response_model=PricingResponse)
def update_pricing(
    req: PricingUpdateRequest,
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    config = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
    if not config:
        config = PricingConfig(id=1)
        db.add(config)

    config.copper_price_usd = req.copper_price_usd
    config.usd_rate = req.usd_rate
    config.fee_percent = req.fee_percent
    config.deduction_percent = req.deduction_percent
    if req.logo_dark_url is not None:
        config.logo_dark_url = req.logo_dark_url
    if req.logo_light_url is not None:
        config.logo_light_url = req.logo_light_url
    if req.favicon_url is not None:
        config.favicon_url = req.favicon_url

    db.commit()
    db.refresh(config)
    return config

