from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from .schemas import LoginRequest, TokenResponse
from .repository import UserRepository
from .service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    try:
        token = service.authenticate(data.username, data.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return TokenResponse(access_token=token)