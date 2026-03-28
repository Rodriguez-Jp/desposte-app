from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.animal import Animal
from ..services.analisis_service import (
    calcular_precios_cortes,
    get_dashboard_metrics,
    calcular_costo_por_kg,
)

router = APIRouter(prefix="/analisis", tags=["Analisis"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)


@router.post("/calcular-precios/{animal_id}")
def calcular_precios(animal_id: int, margen: float = 25.0, db: Session = Depends(get_db)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal no encontrado")
    resultados = calcular_precios_cortes(animal_id, margen, db)
    return {
        "animal_id":       animal_id,
        "animal_codigo":   animal.codigo,
        "margen_objetivo": margen,
        "resultados":      resultados,
    }


@router.get("/costo-kg/{animal_id}")
def costo_kg(animal_id: int, db: Session = Depends(get_db)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal no encontrado")
    return {"animal_id": animal_id, "costo_por_kg": calcular_costo_por_kg(animal, db)}
