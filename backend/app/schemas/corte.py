from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CorteBase(BaseModel):
    animal_id: int
    nombre: str
    categoria: Optional[str] = "ESTANDAR"
    peso_kg: float = Field(..., gt=0)
    porcentaje_rendimiento: Optional[float] = None


class CorteCreate(CorteBase):
    pass


class CorteUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    peso_kg: Optional[float] = None
    porcentaje_rendimiento: Optional[float] = None


class CorteResponse(CorteBase):
    id: int
    precio_sugerido: Optional[float] = None
    precio_mercado_sipsa: Optional[float] = None
    margen_ganancia: Optional[float] = None
    activo: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True
