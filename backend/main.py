import os
from dotenv import load_dotenv
load_dotenv()  # populate os.environ from .env before any module reads env vars
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base, SessionLocal
from app.routes import animales, cortes, costos, sipsa, analisis
from app.routes.auth import router as auth_router
from app.models import animal, corte, costo, precio, historico_sipsa, usuario
from app.services.auth_service import crear_usuario_inicial
from app.limiter import limiter

DEBUG = os.getenv("DEBUG", "false").lower() == "true"

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Desposte de Ganado API",
    description="Sistema de optimización de precios con autenticación JWT",
    version="2.0.0",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        crear_usuario_inicial(db)
    finally:
        db.close()

app.include_router(auth_router,     prefix="/api/v1")
app.include_router(animales.router, prefix="/api/v1")
app.include_router(cortes.router,   prefix="/api/v1")
app.include_router(costos.router,   prefix="/api/v1")
app.include_router(sipsa.router,    prefix="/api/v1")
app.include_router(analisis.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "ok", "version": "2.0.0", "debug": DEBUG}
