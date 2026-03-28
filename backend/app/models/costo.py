from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base


class Costo(Base):
    __tablename__ = "costos"

    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    concepto = Column(String(200), nullable=False)
    categoria = Column(String(100))
    valor = Column(Float, nullable=False)
    unidad = Column(String(50), default="por_animal")
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    notas = Column(String(500))

    animal = relationship("Animal", back_populates="costos")
