from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routes import animales, cortes, costos, sipsa, analisis
from app.routes.auth import router as auth_router
from app.models import animal, corte, costo, precio, historico_sipsa, usuario
from app.services.auth_service import crear_usuario_inicial

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Desposte de Ganado API",
    description="Sistema de optimización de precios con autenticación JWT",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"status": "ok", "version": "2.0.0"}
