from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base


class Corte(Base):
    __tablename__ = "cortes"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    nombre = Column(String(100), nullable=False)
    categoria = Column(String(50), default="ESTANDAR")
    peso_kg = Column(Float, nullable=False)
    porcentaje_rendimiento = Column(Float)
    precio_sugerido = Column(Float)
    precio_mercado_sipsa = Column(Float)
    margen_ganancia = Column(Float)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())

    animal = relationship("Animal", back_populates="cortes")
    precios = relationship("Precio", back_populates="corte", cascade="all, delete-orphan")
