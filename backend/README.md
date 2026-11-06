# Felezyaft Python Backend (FastAPI + SQLAlchemy)

این بخش بک‌اند مستقل و ایمن سامانه **فلزیافت** است که با پایتون، فریم‌ورک **FastAPI**، پایگاه داده **SQLAlchemy**، احراز هویت **JWT** و هشینگ **bcrypt** پیاده‌سازی شده است.

---

## ۱. نحوه راه‌اندازی و اجرا

### الف) ساخت محیط مجازی و نصب وابستگی‌ها:
```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### ب) اجرای سرور API:
```bash
python3 -m uvicorn backend.main:app --reload --port 8000
```
یا از طریق اسکریپت تعریف شده در `package.json`:
```bash
npm run backend
```

سرور روی آدرس `http://localhost:8000` اجرا شده و مستندات تعاملی Swagger در آدرس زیر در دسترس خواهد بود:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## ۲. حساب‌های کاربری پیش‌فرض آزمایشی (Demo Accounts)

در اولین اجرای برنامه، دیتابیس به همراه جداول و حساب‌های کاربری زیر به طور خودکار مقداردهی (Seed) می‌شود:

| نقش | ایمیل | کلمه عبور | دسترسی‌ها |
|---|---|---|---|
| **مدیر کل (Admin)** | `admin@felezyaft.ir` | `admin123456` | مدیریت کامل کاربران، تسویه مالی، تنظیم نرخ ارز و مس، گزارشات |
| **کارشناس (Expert)** | `expert@felezyaft.ir` | `expert123456` | تعیین درصد خلوص، محاسبه کسورات، ثبت وزن باسکول |
| **فروشنده (Seller)** | `seller@felezyaft.ir` | `seller123456` | ثبت محموله مس، کیف پول، درخواست برداشت به شبا |

---

## ۳. متغیرهای محیطی اختیاری (`.env`)

- `PORT`: پورت اجرای سرور (پیش‌فرض: `8000`)
- `DATABASE_URL`: آدرس پایگاه‌داده (پیش‌فرض: `sqlite:///./felezyaft.db`، قابل تغییر به `postgresql://user:pass@host/dbname`)
- `JWT_SECRET_KEY`: کلید اختصاصی امضای توکن‌های احراز هویت

---

## ۴. ساختار پوشه‌ها و ماژول‌ها

- `backend/main.py`: نقطه ورود FastAPI، فعال‌سازی CORS، مانت رسانه‌های آپلودی و Lifespan
- `backend/database.py`: اتصال SQLAlchemy و ساخت سشن
- `backend/models.py`: مدل‌های رابطه ای پایگاه داده (کاربران، پروفایل، نقش‌ها، سفارشات، کیف پول، تسویه‌ها)
- `backend/schemas.py`: اسکیمای Pydantic v2 برای اعتبارسنجی ورودی‌ها و خروجی‌ها
- `backend/auth.py`: توابع امنیتی JWT، هشینگ bcrypt و گارد دسترسی بر اساس نقش (RBAC)
- `backend/routers/`:
  - `auth.py`: ثبت‌نام، ورود، اطلاعات کاربر جاری و تغییر رمز
  - `profile.py`: ویرایش مشخصات فردی، شماره شبا، کارت بانکی، کد ملی و آدرس
  - `pricing.py`: دریافت قیمت زنده و تنظیم موتور قیمت‌گذاری توسط مدیر
  - `shipments.py`: آپلود تصاویر، ثبت سفارش، کارشناسی، توزین باسکول و تسویه اتمیک
  - `wallet.py`: کیف پول، ثبت درخواست برداشت به شبا و تعیین وضعیت توسط مدیر
  - `admin.py`: آمار جامع، مدیریت کاربران، احراز هویت (KYC) و تعیین نقش‌ها
- `backend/seed.py`: مقداردهی خودکار دیتابیس با حساب‌ها و تنظیمات قیمت‌گذاری اولیه

