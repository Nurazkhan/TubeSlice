from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DB_URL = 'postgresql://Niro:Niro2008@localhost:5432/postgres'

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind = engine, autoflush= False, autocommit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

