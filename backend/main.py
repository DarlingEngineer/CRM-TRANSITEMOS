from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from modules.auth.api import router as auth_router
from modules.tickets.api import router as tickets_router
from modules.metrics.api import router as metrics_router
from core.security import get_current_user
import os

app = FastAPI(title="CRM API")

# Permitir conexiones desde React (CORS)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(metrics_router)

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user