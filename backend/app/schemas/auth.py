from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.usuario import RolUsuario

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    rol:          RolUsuario
    nombre:       str
    username:     str
    expires_in:   int

class UsuarioCreate(BaseModel):
    nombre:   str
    email:    EmailStr
    username: str
    password: str
    rol:      RolUsuario = RolUsuario.ESTANDAR

class UsuarioOut(BaseModel):
    id:             int
    nombre:         str
    email:          str
    username:       str
    rol:            RolUsuario
    activo:         bool
    fecha_creacion: Optional[datetime]
    ultimo_acceso:  Optional[datetime]
    class Config:
        from_attributes = True

class UsuarioUpdate(BaseModel):
    nombre:  Optional[str]        = None
    email:   Optional[str]        = None
    activo:  Optional[bool]       = None
    rol:     Optional[RolUsuario] = None

class CambioPassword(BaseModel):
    password_actual: str
    password_nueva:  str
