from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..models.corte import Corte
from ..schemas.corte import CorteCreate, CorteUpdate, CorteResponse

router = APIRouter(prefix="/cortes", tags=["Cortes"])


@router.post("/", response_model=CorteResponse, status_code=201)
def crear_corte(data: CorteCreate, db: Session = Depends(get_db)):
    corte = Corte(**data.model_dump())
    db.add(corte)
    db.commit()
    db.refresh(corte)
    return corte


@router.get("/", response_model=List[CorteResponse])
def listar_cortes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Corte).offset(skip).limit(limit).all()


@router.get("/animal/{animal_id}", response_model=List[CorteResponse])
def cortes_por_animal(animal_id: int, db: Session = Depends(get_db)):
    return db.query(Corte).filter(Corte.animal_id == animal_id).all()


@router.get("/{corte_id}", response_model=CorteResponse)
def obtener_corte(corte_id: int, db: Session = Depends(get_db)):
    c = db.query(Corte).filter(Corte.id == corte_id).first()
    if not c:
        raise HTTPException(404, "Corte no encontrado")
    return c


@router.put("/{corte_id}", response_model=CorteResponse)
def actualizar_corte(corte_id: int, data: CorteUpdate, db: Session = Depends(get_db)):
    c = db.query(Corte).filter(Corte.id == corte_id).first()
    if not c:
        raise HTTPException(404, "Corte no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{corte_id}", status_code=204)
def eliminar_corte(corte_id: int, db: Session = Depends(get_db)):
    c = db.query(Corte).filter(Corte.id == corte_id).first()
    if not c:
        raise HTTPException(404, "Corte no encontrado")
    db.delete(c)
    db.commit()
