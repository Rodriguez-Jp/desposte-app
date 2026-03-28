from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from app.database import get_db
from app.schemas.auth import (LoginRequest, TokenResponse, UsuarioCreate,
                               UsuarioOut, UsuarioUpdate, CambioPassword)
from app.services.auth_service import (autenticar_usuario, create_access_token,
                                        hash_password, verify_password, TOKEN_EXPIRE)
from app.models.usuario import Usuario
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = autenticar_usuario(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Credenciales incorrectas")
    token = create_access_token(
        {"sub": user.username, "rol": user.rol, "id": user.id},
        expires_delta=timedelta(minutes=TOKEN_EXPIRE),
    )
    return TokenResponse(access_token=token, rol=user.rol,
                         nombre=user.nombre, username=user.username,
                         expires_in=TOKEN_EXPIRE * 60)

@router.get("/me", response_model=UsuarioOut)
def me(current_user: Usuario = Depends(get_current_user)):
    return current_user

@router.post("/cambiar-password")
def cambiar_password(data: CambioPassword,
                     current_user: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    if not verify_password(data.password_actual, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    current_user.hashed_password = hash_password(data.password_nueva)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}

@router.get("/usuarios", response_model=List[UsuarioOut])
def listar_usuarios(admin: Usuario = Depends(require_admin),
                    db: Session = Depends(get_db)):
    return db.query(Usuario).order_by(Usuario.id).all()

@router.post("/usuarios", response_model=UsuarioOut, status_code=201)
def crear_usuario(data: UsuarioCreate,
                  admin: Usuario = Depends(require_admin),
                  db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == data.username).first():
        raise HTTPException(status_code=400, detail="El username ya existe")
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya existe")
    user = Usuario(nombre=data.nombre, email=data.email, username=data.username,
                   hashed_password=hash_password(data.password), rol=data.rol)
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.put("/usuarios/{user_id}", response_model=UsuarioOut)
def actualizar_usuario(user_id: int, data: UsuarioUpdate,
                       admin: Usuario = Depends(require_admin),
                       db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit(); db.refresh(user)
    return user

@router.delete("/usuarios/{user_id}", status_code=204)
def eliminar_usuario(user_id: int, admin: Usuario = Depends(require_admin),
                     db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user); db.commit()
