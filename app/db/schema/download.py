from pydantic import BaseModel, ConfigDict

class downloadIn(BaseModel):
    url: str
    format: str

class downloadInstanceIn(BaseModel):
    title: str
    duration: int
    uploader: str
    youtube_url: str
    download_url: str
    status: str
    format: str

class downloadOutput(BaseModel):
    model_config = ConfigDict(from_attributes= True)

    id: str
    title: str
    duration: int
    uploader: str
    youtube_url: str
    download_url: str
    createdAt: float
    status: str
    format: str