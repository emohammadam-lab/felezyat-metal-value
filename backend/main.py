import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import Base, engine
from backend.seed import seed_database
from backend.routers import auth, profile, pricing, shipments, wallet, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Ensure upload folder exists
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads", "shipment-photos")
    os.makedirs(upload_dir, exist_ok=True)
    # Seed default data
    seed_database()
    yield


app = FastAPI(
    title="فلزیافت API (Felezyaft Backend)",
    version="2.0.0",
    description="Backend API for Felezyaft metal recycling and valuation platform",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static media serving for uploaded photos
uploads_path = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(pricing.router)
app.include_router(shipments.router)
app.include_router(wallet.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "felezyaft-backend",
        "version": "2.0.0",
        "currency": "Toman",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

