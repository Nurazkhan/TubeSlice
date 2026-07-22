from app.config.database import Base
from sqlalchemy import Column, String,Float, Integer
import uuid
import time

class DownloadInstance(Base):
    __tablename__ = "Downloads"

    id = Column(String(250), primary_key=True, default = lambda : str(uuid.uuid4()), nullable=False)
    title = Column(String(200))
    duration = Column(Integer())
    uploader = Column(String(80))
    youtube_url = Column(String(500))
    download_url = Column(String(500))
    status = Column(String(20), default='Accepted') # accepted, finished
    createdAt = Column(Float(), default= lambda : time.time())
    user_id = Column(String(250), nullable = True) 
    format = Column(String(100)) #video:720p, music:wav, info
