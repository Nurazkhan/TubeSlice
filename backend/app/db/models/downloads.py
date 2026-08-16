from app.config.database import Base
from sqlalchemy import Column, String,Float, Integer, ForeignKey
import uuid
import time
from sqlalchemy.orm import relationship

class DownloadInstance(Base):
    __tablename__ = "Downloads"

    id = Column(String(250), primary_key=True, default = lambda : str(uuid.uuid4()), nullable=False)
    title = Column(String(200))
    duration = Column(Integer())
    uploader = Column(String(80))
    youtube_url = Column(String(500))
    status = Column(String(20), default='Accepted') # accepted, finished
    createdAt = Column(Float(), default= lambda : time.time())
    user_id = Column(String(250), nullable = True) 
 
    segments = relationship("Segment", back_populates="download", cascade="all, delete-orphan")

class Segment(Base):
    __tablename__ = "Segments"
    id= Column(String(250), primary_key=True, default = lambda : str(uuid.uuid4()), nullable=False)
    download_id = Column(String(250), ForeignKey('Downloads.id') ) 
    start_time = Column(Integer())
    end_time = Column(Integer())
    status = Column(String(20), default='Accepted') 
    format = Column(String(100)) #video:720p, music:wav, info
    createdAt = Column(Float(), default= lambda : time.time())

    download = relationship("DownloadInstance", back_populates="segments")

