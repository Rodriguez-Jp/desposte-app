from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base


class Precio(Base):
    __tablename__ = "precios"

    id = Column(Integer, primary_key=True, index=True)
    corte_id = Column(Integer, ForeignKey("cortes.id"), nullable=False)
    precio_costo_unitario = Column(Float)
    precio_sugerido = Column(Float)
    margen_objetivo = Column(Float, default=25.0)
    precio_sipsa_referencia = Column(Float)
    precio_minimo_viable = Column(Float)
    precio_maximo_mercado = Column(Float)
    nivel_confianza = Column(Float)
    fecha_calculo = Column(DateTime(timezone=True), server_default=func.now())
    activo = Column(Boolean, default=True)

    corte = relationship("Corte", back_populates="precios")
