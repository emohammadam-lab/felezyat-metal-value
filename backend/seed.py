from backend.database import SessionLocal
from backend.models import User, Profile, UserRole, Wallet, PricingConfig, Shipment
from backend.auth import hash_password


def seed_database():
    db = SessionLocal()
    try:
        # 1. Pricing config
        pricing = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
        if not pricing:
            pricing = PricingConfig(
                id=1,
                copper_price_usd=9.50,
                usd_rate=900000,  # 900,000 Rials (90,000 Tomans)
                fee_percent=3.00,
                deduction_percent=2.00,
            )
            db.add(pricing)
            db.commit()

        # 2. Demo users
        demos = [
            {
                "email": "admin@felezyaft.ir",
                "password": "admin123456",
                "name": "مدیر سیستم فلزیافت",
                "phone": "09120000001",
                "roles": ["admin", "expert", "seller"],
                "verified": True,
            },
            {
                "email": "expert@felezyaft.ir",
                "password": "expert123456",
                "name": "کارشناس متالورژی فلزیافت",
                "phone": "09120000002",
                "roles": ["expert", "seller"],
                "verified": True,
            },
            {
                "email": "seller@felezyaft.ir",
                "password": "seller123456",
                "name": "رضا محمدی (فروشنده)",
                "phone": "09121112233",
                "roles": ["seller"],
                "verified": True,
            },
        ]

        for d in demos:
            user = db.query(User).filter(User.email == d["email"]).first()
            if not user:
                user = User(
                    email=d["email"],
                    password_hash=hash_password(d["password"]),
                    is_active=True,
                )
                db.add(user)
                db.flush()

                profile = Profile(
                    user_id=user.id,
                    full_name=d["name"],
                    phone=d["phone"],
                    national_id="0012345678",
                    iban_sheba="IR120170000000123456789012",
                    bank_card="6037991812345678",
                    default_address="تهران، بازار شوش، خیابان فداییان اسلام، کارگاه مس",
                    verified=d["verified"],
                )
                wallet = Wallet(user_id=user.id, balance=25000000 if "seller" in d["roles"] else 0)
                db.add_all([profile, wallet])

                for r in d["roles"]:
                    db.add(UserRole(user_id=user.id, role=r))

                db.commit()

        # Seed sample shipment if none exist
        count = db.query(Shipment).count()
        if count == 0:
            seller = db.query(User).filter(User.email == "seller@felezyaft.ir").first()
            if seller:
                s1 = Shipment(
                    seller_id=seller.id,
                    scrap_type="coated_cable",
                    estimated_weight=45.0,
                    purity_percent=60.0,
                    address="تهران، خیابان شوش شرقی، پلاک ۱۲",
                    description="کابل‌های روکش‌دار فشار ضعیف باقی‌مانده از پروژه ساختمانی",
                    estimated_price=22000000,
                    status="awaiting_expert",
                )
                db.add(s1)
                db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

