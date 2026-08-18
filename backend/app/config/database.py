from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DB_URL = 'postgresql://tubeslice_user:tubeslice_password@localhost:5432/postgres'

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind = engine, autoflush= False, autocommit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

