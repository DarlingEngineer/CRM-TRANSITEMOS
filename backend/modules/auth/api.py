from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.permissions import require_roles
from .schemas import LoginRequest, TokenResponse, UserCreate, UserResponse, RoleUpdate
from .repository import UserRepository
from .service import AuthService, UserManagementService
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


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_role(
    user_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = UserManagementService(UserRepository(db))
    try:
        return service.change_role(user_id, data.role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))