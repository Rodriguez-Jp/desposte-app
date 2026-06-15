from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PrecioResponse(BaseModel):
    id: int
    corte_id: int
    precio_costo_unitario: Optional[float] = None
    precio_sugerido: Optional[float] = None
    margen_objetivo: float
    precio_sipsa_referencia: Optional[float] = None
    precio_minimo_viable: Optional[float] = None
    precio_maximo_mercado: Optional[float] = None
    fecha_calculo: datetime
    activo: bool

    class Config:
        from_attributes = True
