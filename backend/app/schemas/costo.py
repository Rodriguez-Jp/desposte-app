from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CostoBase(BaseModel):
    animal_id: Optional[int] = None
    concepto: str
    categoria: Optional[str] = None
    valor: float
    unidad: Optional[str] = "por_animal"
    notas: Optional[str] = None


class CostoCreate(CostoBase):
    pass


class CostoUpdate(BaseModel):
    concepto: Optional[str] = None
    categoria: Optional[str] = None
    valor: Optional[float] = None
    unidad: Optional[str] = None
    notas: Optional[str] = None


class CostoResponse(CostoBase):
    id: int
    fecha_registro: datetime

    class Config:
        from_attributes = True
