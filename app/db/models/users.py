from app.config.database import Base
from sqlalchemy import Column, Boolean, String
import uuid 
from sqlalchemy.dialects.postgresql import UUID


class User(Base):
    __tablename__ = "Users"

    
    id = Column(String(250), primary_key=True, default=uuid.uuid4)
    first_name = Column( String(50))
    last_name = Column( String(50))
    email = Column(String(70), unique= True)
    password = Column(String(250))
    isAdmin = Column(Boolean, default=False)