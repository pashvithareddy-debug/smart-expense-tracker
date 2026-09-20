import os
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models
from routers import auth_routes, transaction_routes, budget_routes, analytics_routes

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Expense Tracker API",
    description="Enterprise-grade Personal Finance & Smart Expense Tracking REST API with JWT Auth, PostgreSQL, and Smart Analytics",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(transaction_routes.router)
app.include_router(budget_routes.router)
app.include_router(analytics_routes.router)


@app.get("/", tags=["System"])
def root():
    return {
        "project": "Smart Expense Tracker API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)