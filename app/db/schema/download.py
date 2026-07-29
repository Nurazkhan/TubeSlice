from pydantic import BaseModel, ConfigDict


    
class segmentOutput(BaseModel):
    model_config = ConfigDict(from_attributes= True)

    id: str
    download_id: str
    start_time: int
    end_time: int
    status: str
    format: str
    
    createdAt: float

class segmentIn(BaseModel):
    model_config = ConfigDict(from_attributes= True)
    download_id: str
    start_time: int
    end_time: int
    format: str


   

class downloadIn(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    download_id: str
    url: str
    format: str

class downloadSegmentIn(BaseModel):
    url: str
    segments: list[segmentIn]

class downloadInstanceIn(BaseModel):
    title: str
    duration: int
    uploader: str
    youtube_url: str
    status: str

class downloadOutput(BaseModel):
    model_config = ConfigDict(from_attributes= True)

    id: str
    title: str
    duration: int
    uploader: str
    youtube_url: str
    
    createdAt: float
    status: str
    segments: list[segmentOutput]
    


