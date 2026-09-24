from core.database import SessionLocal
from modules.auth.models import Role

db = SessionLocal()             #Inserta en la columna de roles 2 registros
if not db.query(Role).first():
    db.add_all([
        Role(name="admin", description="Acceso total al sistema"),
        Role(name="tecnico", description="Gestiona tickets y trámites"),
    ])
    db.commit()
db.close()