from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.usuario import Usuario, RolUsuario
import bcrypt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Add it to backend/.env before starting the application."
    )

ALGORITHM    = "HS256"
TOKEN_EXPIRE = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))


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
        {
            "nombre":   "Administrador",
            "email":    os.getenv("ADMIN_EMAIL",    "admin@desposte.com"),
            "username": os.getenv("ADMIN_USERNAME", "admin"),
            "password": os.getenv("ADMIN_PASSWORD"),
            "rol":      RolUsuario.ADMIN,
        },
        {
            "nombre":   "Operador",
            "email":    os.getenv("OPERADOR_EMAIL",    "operador@desposte.com"),
            "username": os.getenv("OPERADOR_USERNAME", "operador"),
            "password": os.getenv("OPERADOR_PASSWORD"),
            "rol":      RolUsuario.ESTANDAR,
        },
    ]
    for u in defaults:
        if not u["password"]:
            continue
        if not db.query(Usuario).filter(Usuario.username == u["username"]).first():
            db.add(Usuario(
                nombre=u["nombre"], email=u["email"], username=u["username"],
                hashed_password=hash_password(u["password"]), rol=u["rol"],
            ))
    db.commit()
