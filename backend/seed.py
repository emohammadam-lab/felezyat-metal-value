from backend.database import SessionLocal
from backend.models import User, Profile, UserRole, Wallet, PricingConfig, Shipment, SystemSetting
from backend.auth import hash_password


def seed_database():
    db = SessionLocal()
    try:
        # 1. Pricing config & branding
        pricing = db.query(PricingConfig).filter(PricingConfig.id == 1).first()
        if not pricing:
            pricing = PricingConfig(
                id=1,
                copper_price_usd=9.50,
                usd_rate=900000,  # 900,000 Rials (90,000 Tomans)
                fee_percent=3.00,
                deduction_percent=2.00,
                logo_dark_url="/logo-dark.png",
                logo_light_url="/logo-light.png",
                favicon_url="/favicon.ico",
            )
            db.add(pricing)
            db.commit()
        else:
            pricing.logo_dark_url = "/logo-dark.png"
            pricing.logo_light_url = "/logo-light.png"
            pricing.favicon_url = "/favicon.ico"
            db.commit()

        # 1.5 System Settings (Logos, Icons, Branding, Typography)
        branding_settings = [
            ("logo_dark", "/logo-dark.png", "لوگوی رسمی فلزیافت برای حالت شب"),
            ("logo_light", "/logo-light.png", "لوگوی رسمی فلزیافت برای حالت روز"),
            ("favicon", "/favicon.ico", "آیکون چندرزولوشنه تب مرورگر"),
            ("apple_touch_icon", "/apple-touch-icon.png", "آیکون اپل و دستگاه‌های لمسی"),
            ("icon_192", "/icon-192.png", "آیکون PWA ۱۹۲ پیکسل"),
            ("icon_512", "/icon-512.png", "آیکون PWA ۵۱۲ پیکسل"),
            ("site_title", "فلزیافت — سامانه هوشمند خرید و بازیافت فلزات", "عنوان سایت"),
            ("font_family_primary", "Vazirmatn", "فونت اصلی سامانه (فونت استاندارد فارسی وزیرمتن)"),
            ("font_family_fallback", "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, IRANSans, B Yekan, Tahoma, sans-serif", "فونت‌های پشتیبان سیستمی برای بارگذاری سریع"),
            ("typography_headings", "وزن ۸۰۰ و ۹۰۰ با ارتفاع سطر ۱.۲۵ تا ۱.۳۵ (بدون تنگی حروف)", "استاندارد تایپوگرافی عناوین و تیترها"),
            ("typography_body", "سایز ۱۵ پیکسل با ارتفاع سطر ۱.۷۵ برای حداکثر خوانایی", "استاندارد متن بدنه و پاراگراف‌ها"),
            ("typography_lead", "سایز ۱۸ پیکسل با ارتفاع سطر ۱.۸ برای لید و مقدمه‌ها", "استاندارد متن لید"),
        ]
        for key, val, desc in branding_settings:
            item = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not item:
                item = SystemSetting(key=key, value=val, description=desc)
                db.add(item)
            else:
                item.value = val
                item.description = desc
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

