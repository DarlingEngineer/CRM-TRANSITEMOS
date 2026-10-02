from core.database import SessionLocal
from modules.tickets.models import Area

AREAS = [
    "Registro Automotor",
    "Cobro Coactivo",
    "Cartera",
    "Jurídica",
    "Concesionarios",
    "Archivo",
    "Recursos Humanos",
    "Comercial",
]

db = SessionLocal()
existentes = {a.name for a in db.query(Area).all()}
nuevas = [Area(name=n) for n in AREAS if n not in existentes]
if nuevas:
    db.add_all(nuevas)
    db.commit()
    print(f"Se crearon {len(nuevas)} áreas nuevas.")
else:
    print("Todas las áreas ya existían.")
db.close()