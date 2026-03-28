from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..models.animal import Animal
from ..schemas.animal import AnimalCreate, AnimalUpdate, AnimalResponse
from ..services.analisis_service import calcular_rendimiento_animal

router = APIRouter(prefix="/animales", tags=["Animales"])


@router.post("/", response_model=AnimalResponse, status_code=201)
def crear_animal(data: AnimalCreate, db: Session = Depends(get_db)):
    animal = Animal(**data.model_dump())
    animal.rendimiento_canal = calcular_rendimiento_animal(animal)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.get("/", response_model=List[AnimalResponse])
def listar_animales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Animal).offset(skip).limit(limit).all()


@router.get("/{animal_id}", response_model=AnimalResponse)
def obtener_animal(animal_id: int, db: Session = Depends(get_db)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal no encontrado")
    return animal


@router.put("/{animal_id}", response_model=AnimalResponse)
def actualizar_animal(animal_id: int, data: AnimalUpdate, db: Session = Depends(get_db)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(animal, k, v)
    animal.rendimiento_canal = calcular_rendimiento_animal(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.delete("/{animal_id}", status_code=204)
def eliminar_animal(animal_id: int, db: Session = Depends(get_db)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal no encontrado")
    db.delete(animal)
    db.commit()
