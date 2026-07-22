from app.config.database import Base
from sqlalchemy import Column, String
import uuid 


class User(Base):
    __tablename__ = "Users"

    
    id = Column(String(250), primary_key=True, default=lambda : str(uuid.uuid4()), nullable= False)
    first_name = Column( String(50))
    last_name = Column( String(50))
    email = Column(String(70), unique= True)
    password = Column(String(250))
    role = Column(String(50), default="FREE")