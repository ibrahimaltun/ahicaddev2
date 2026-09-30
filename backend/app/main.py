from fastapi import FastAPI
from sqlalchemy import text

from app.db.session import engine

from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.products import router as products_router

app = FastAPI(
    title="Ahicadde",
    version="0.1.0",
)

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    categories_router,
    prefix="/api/v1",
)

app.include_router(
    products_router,
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
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "connected",
        "result": value,
    }
