
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging

load_dotenv()

from modules.auth.api import router as auth_router
from modules.tickets.api import router as tickets_router, areas_router
from modules.metrics.api import router as metrics_router
from core.security import get_current_user

# Configuración de la aplicación
app = FastAPI(title="CRM API")

# Registro de eventos
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("crm")
logger.info("CRM API iniciada")

# Configuración CORS para el frontend
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,https://localhost:8443"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas de la API
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(areas_router)
app.include_router(metrics_router)


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user


# Servir el frontend compilado si existe
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if DIST.exists():
    assets_dir = DIST / "assets"

    if assets_dir.exists():
        app.mount(
            "/assets",
            StaticFiles(directory=str(assets_dir)),
            name="assets"
        )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        # Evitar que la ruta general intercepte endpoints de la API
        if full_path.split("/")[0] in (
            "auth", "tickets", "areas", "metrics", "me", "health"
        ):
            raise HTTPException(status_code=404)

        file_path = DIST / full_path

        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))

        index_file = DIST / "index.html"

        if index_file.exists():
            return FileResponse(str(index_file))

        raise HTTPException(
            status_code=404,
            detail="No se encontró el archivo del frontend"
        )
