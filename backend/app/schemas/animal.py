from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AnimalBase(BaseModel):
    codigo: str
    tipo: str = "BOVINO"
    raza: Optional[str] = None
    peso_vivo: float = Field(..., gt=0)
    peso_canal: Optional[float] = None
    calidad: str = "PRIMERA"
    precio_compra: float = Field(..., gt=0)
    fecha_sacrificio: Optional[datetime] = None
    notas: Optional[str] = None


class AnimalCreate(AnimalBase):
    pass


class AnimalUpdate(BaseModel):
    tipo: Optional[str] = None
    raza: Optional[str] = None
    peso_vivo: Optional[float] = None
    peso_canal: Optional[float] = None
    calidad: Optional[str] = None
    precio_compra: Optional[float] = None
    notas: Optional[str] = None


class AnimalResponse(AnimalBase):
    id: int
    rendimiento_canal: Optional[float] = None
    fecha_registro: datetime

    class Config:
        from_attributes = True
