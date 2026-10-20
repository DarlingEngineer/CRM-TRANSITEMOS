from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()
from modules.auth.api import router as auth_router
from modules.tickets.api import router as tickets_router, areas_router
from modules.metrics.api import router as metrics_router
from core.security import get_current_user
import os

app = FastAPI(title="CRM API")

# Logging básico para errores y arranque
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("crm")
logger.info("CRM API iniciada")

# Permitir conexiones desde React (CORS)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,

    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),

    allow_origins=cors_origins,

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(areas_router)
app.include_router(metrics_router)

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Servir el frontend compilado (SPA) si existe frontend/dist
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        # No interceptar rutas de la API
        if full_path.split("/")[0] in ("auth", "tickets", "areas", "metrics", "me"):
            raise HTTPException(status_code=404)
        file = DIST / full_path
        if full_path and file.exists() and file.is_file():
            return FileResponse(file)
        return FileResponse(DIST / "index.html")