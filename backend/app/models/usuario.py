from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base

class RolUsuario(str, enum.Enum):
    ADMIN    = "ADMIN"
    ESTANDAR = "ESTANDAR"

class Usuario(Base):
    __tablename__ = "usuarios"
    id              = Column(Integer, primary_key=True, index=True)
    nombre          = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, index=True, nullable=False)
    username        = Column(String(50),  unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rol             = Column(Enum(RolUsuario), default=RolUsuario.ESTANDAR, nullable=False)
    activo           = Column(Boolean, default=True)
    password_version = Column(Integer, default=1, nullable=False, server_default="1")
    fecha_creacion   = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_acceso    = Column(DateTime(timezone=True), nullable=True)
