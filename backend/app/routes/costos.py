from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..models.costo import Costo
from ..schemas.costo import CostoCreate, CostoUpdate, CostoResponse

router = APIRouter(prefix="/costos", tags=["Costos"])


@router.post("/", response_model=CostoResponse, status_code=201)
def crear_costo(data: CostoCreate, db: Session = Depends(get_db)):
    costo = Costo(**data.model_dump())
    db.add(costo)
    db.commit()
    db.refresh(costo)
    return costo


@router.get("/", response_model=List[CostoResponse])
def listar_costos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Costo).offset(skip).limit(limit).all()


@router.get("/animal/{animal_id}", response_model=List[CostoResponse])
def costos_por_animal(animal_id: int, db: Session = Depends(get_db)):
    return db.query(Costo).filter(Costo.animal_id == animal_id).all()


@router.put("/{costo_id}", response_model=CostoResponse)
def actualizar_costo(costo_id: int, data: CostoUpdate, db: Session = Depends(get_db)):
    c = db.query(Costo).filter(Costo.id == costo_id).first()
    if not c:
        raise HTTPException(404, "Costo no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{costo_id}", status_code=204)
def eliminar_costo(costo_id: int, db: Session = Depends(get_db)):
    c = db.query(Costo).filter(Costo.id == costo_id).first()
    if not c:
        raise HTTPException(404, "Costo no encontrado")
    db.delete(c)
    db.commit()
