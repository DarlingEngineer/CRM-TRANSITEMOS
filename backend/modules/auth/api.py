from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.permissions import require_roles
from .schemas import LoginRequest, TokenResponse, UserCreate, UserResponse, RoleUpdate, RefreshRequest, RoleCreate, PasswordReset
from .repository import UserRepository
from .service import AuthService, UserManagementService
from .security import create_access_token, create_refresh_token
from jose import jwt, JWTError
from .security import SECRET_KEY, ALGORITHM
from pydantic import BaseModel, ConfigDict

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    try:
        tokens = service.authenticate(data.username, data.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest):
    try:
        payload = jwt.decode(data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise ValueError("Tipo de token inválido")
        new_payload = {"sub": payload["sub"], "user_id": payload["user_id"], "role": payload["role"]}
        return TokenResponse(
            access_token=create_access_token(new_payload),
            refresh_token=create_refresh_token(new_payload),
        )
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")


@router.get("/roles")
def list_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    from .models import Role
    roles = db.query(Role).order_by(Role.id).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]


@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        service.delete_role(role_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"detail": "Rol eliminado"}


@router.post("/roles", status_code=201)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    from .models import Role
    if db.query(Role).filter(Role.name == data.name).first():
        raise HTTPException(status_code=400, detail="El rol ya existe")
    role = Role(name=data.name, description=data.description)
    db.add(role)
    db.commit()
    db.refresh(role)
    return {"id": role.id, "name": role.name, "description": role.description}


@router.post("/users", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        user = service.create_user(data.username, data.password, data.role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return UserResponse.from_user(user)



@router.get("/users", response_model=list[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    users = service.list_users(skip, limit)
    return [UserResponse.from_user(u) for u in users]


@router.patch("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        user = service.deactivate_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return UserResponse.from_user(user)



@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        service.delete_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"detail": "Usuario eliminado"}


@router.patch("/users/{user_id}/password", response_model=UserResponse)
def reset_password(
    user_id: int,
    data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        user = service.reset_password(user_id, data.password)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return UserResponse.from_user(user)



@router.patch("/users/{user_id}/reactivate", response_model=UserResponse)
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        user = service.reactivate_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return UserResponse.from_user(user)


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_role(
    user_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        user = service.change_role(user_id, data.role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return UserResponse.from_user(user)