from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.usuario import Usuario, RolUsuario
import bcrypt
import os

SECRET_KEY   = os.getenv("SECRET_KEY", "desposte-secret-key-cambia-en-produccion-2026")
ALGORITHM    = "HS256"
TOKEN_EXPIRE = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=TOKEN_EXPIRE))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_usuario_by_username(db: Session, username: str) -> Optional[Usuario]:
    return db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo   == True
    ).first()

def autenticar_usuario(db: Session, username: str, password: str) -> Optional[Usuario]:
    user = get_usuario_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    user.ultimo_acceso = datetime.now(timezone.utc)
    db.commit()
    return user

def crear_usuario_inicial(db: Session):
    defaults = [
        {"nombre": "Administrador", "email": "admin@desposte.com",
         "username": "admin",    "password": "Admin2026!",    "rol": RolUsuario.ADMIN},
        {"nombre": "Operador",    "email": "operador@desposte.com",
         "username": "operador", "password": "Operador2026!", "rol": RolUsuario.ESTANDAR},
    ]
    for u in defaults:
        if not db.query(Usuario).filter(Usuario.username == u["username"]).first():
            db.add(Usuario(
                nombre=u["nombre"], email=u["email"], username=u["username"],
                hashed_password=hash_password(u["password"]), rol=u["rol"],
            ))
    db.commit()