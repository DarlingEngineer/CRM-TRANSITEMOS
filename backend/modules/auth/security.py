"""Utilidades de seguridad del modulo de autenticacion.

Hashing de contrasenas y creacion de tokens JWT. La validacion del token (lectura) vive en core/security.py, compartida por todos los modulos.
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY no esta definida. Agregala en tu archivo .env"
        "(genera una con : python -c \"import secrets; print(secrets.token_hex(32))\")"
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password:str, hashed_password:str) -> bool:
    """Compara una contrasena en texto plano contra su hash almacenado."""
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    """Genera el hash bcrypt de una contrasena para guardarlo en la BD"""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """cREA UN JWT firmado que expira en ACCESS_TOKEN_EXPIRE_MINUTES"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)