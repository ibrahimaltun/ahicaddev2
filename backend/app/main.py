from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.db.session import engine

from app.api.v1.auth import router as auth_router
from app.api.v1.cart import router as cart_router
from app.api.v1.categories import router as categories_router
from app.api.v1.orders import router as orders_router
from app.api.v1.products import router as products_router
from app.api.v1.seller_applications import router as seller_applications_router

app = FastAPI(
    title="Ahicadde",
    version="0.1.0",
)

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    cart_router,
    prefix="/api/v1",
)

app.include_router(
    categories_router,
    prefix="/api/v1",
)

app.include_router(
    orders_router,
    prefix="/api/v1",
)

app.include_router(
    products_router,
    prefix="/api/v1",
)

app.include_router(
    seller_applications_router,
    prefix="/api/v1",
)


@app.get("/")
async def root():
    return {
        "name": "Ahicadde",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
    }


@app.get("/health/db")
async def database_health():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            value = result.scalar()
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "database": "unavailable",
            },
        )

    return {
        "database": "connected",
        "result": value,
    }
