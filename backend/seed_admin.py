from core.database import SessionLocal
from modules.auth.models import User, Role
from modules.auth.security import hash_password

db = SessionLocal()

existing = db.query(User).filter(User.username == "admin").first()
if not existing:
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        raise Exception("No existe el rol 'admin' — corre primero seed.py")

    nuevo_admin = User(
        username="admin",
        hashed_password=hash_password("Sbrqscmda0216"),
        role_id=admin_role.id,
    )
    db.add(nuevo_admin)
    db.commit()
    print("Usuario admin creado correctamente.")
else:
    print("El usuario admin ya existe, no se creó de nuevo.")

db.close()