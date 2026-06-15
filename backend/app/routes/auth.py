import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
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
from app.limiter import limiter

DEBUG = os.getenv("DEBUG", "false").lower() == "true"

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, response: Response,
          db: Session = Depends(get_db)):
    user = autenticar_usuario(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Credenciales incorrectas")
    token = create_access_token(
        {"sub": user.username, "rol": user.rol, "id": user.id,
         "pwd_v": user.password_version},
        expires_delta=timedelta(minutes=TOKEN_EXPIRE),
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=not DEBUG,       # True in production (HTTPS)
        max_age=TOKEN_EXPIRE * 60,
    )
    return TokenResponse(access_token=token, rol=user.rol,
                         nombre=user.nombre, username=user.username,
                         expires_in=TOKEN_EXPIRE * 60)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", samesite="lax")
    return {"mensaje": "Sesión cerrada correctamente"}


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
    # Bump version → all existing tokens become invalid immediately
    current_user.password_version = (current_user.password_version or 0) + 1
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
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/usuarios/{user_id}", response_model=UsuarioOut)
def actualizar_usuario(user_id: int, data: UsuarioUpdate,
                       admin: Usuario = Depends(require_admin),
                       db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    cambios = data.model_dump(exclude_none=True)
    nueva_password = cambios.pop("password", None)
    if nueva_password is not None:
        if len(nueva_password) < 8:
            raise HTTPException(status_code=400,
                                detail="La contraseña debe tener mínimo 8 caracteres")
        user.hashed_password = hash_password(nueva_password)
        # Bump version → invalidate the user's existing tokens immediately
        user.password_version = (user.password_version or 0) + 1
    for k, v in cambios.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/usuarios/{user_id}", status_code=204)
def eliminar_usuario(user_id: int, admin: Usuario = Depends(require_admin),
                     db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
