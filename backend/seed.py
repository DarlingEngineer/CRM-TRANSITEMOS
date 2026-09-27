from core.database import SessionLocal
from modules.auth.models import Role

db = SessionLocal()
roles_existentes = {r.name for r in db.query(Role).all()}

nuevos = []
if "admin" not in roles_existentes:
    nuevos.append(Role(name="admin", description="Acceso total al sistema"))
if "tecnico" not in roles_existentes:
    nuevos.append(Role(name="tecnico", description="Gestiona tickets y trámites"))
if "solicitante" not in roles_existentes:
    nuevos.append(Role(name="solicitante", description="Solo puede crear tickets"))

if nuevos:
    db.add_all(nuevos)
    db.commit()

db.close()