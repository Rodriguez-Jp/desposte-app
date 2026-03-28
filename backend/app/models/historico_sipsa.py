from sqlalchemy import Column, Integer, String, Float, DateTime, Date
from sqlalchemy.sql import func
from ..database.connection import Base


class HistoricoSIPSA(Base):
    __tablename__ = "historico_sipsa"

    id = Column(Integer, primary_key=True, index=True)
    producto = Column(String(200), nullable=False)
    mercado = Column(String(200))
    ciudad = Column(String(100))
    precio_promedio = Column(Float)
    precio_minimo = Column(Float)
    precio_maximo = Column(Float)
    unidad = Column(String(50))
    semana = Column(String(20))
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    fecha_consulta = Column(DateTime(timezone=True), server_default=func.now())
