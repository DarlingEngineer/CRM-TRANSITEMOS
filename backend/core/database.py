from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)  # conexion hacia postgres
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # hace operaciones con la base de datos y luego las confirma
Base = declarative_base() # clase que heredan todos los modelos de la base de datos, permite a sqlalchemy reconocer que las clases representan tablas, y alembic que comparar con la base de datos real.

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()