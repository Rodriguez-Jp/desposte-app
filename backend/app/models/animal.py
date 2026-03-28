from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base


class Animal(Base):
    __tablename__ = "animales"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False)
    tipo = Column(String(20), nullable=False, default="BOVINO")
    raza = Column(String(100))
    peso_vivo = Column(Float, nullable=False)
    peso_canal = Column(Float)
    rendimiento_canal = Column(Float)
    calidad = Column(String(20), default="PRIMERA")
    precio_compra = Column(Float, nullable=False)
    fecha_sacrificio = Column(DateTime(timezone=True))
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    notas = Column(String(500))

    cortes = relationship("Corte", back_populates="animal", cascade="all, delete-orphan")
    costos = relationship("Costo", back_populates="animal", cascade="all, delete-orphan")
