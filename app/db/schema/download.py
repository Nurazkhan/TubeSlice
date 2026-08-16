from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class UrlRequest(BaseModel):
    url: str


class Format(BaseModel):
    format_id: str
    ext: str
    resolution: str
    note: str | None

class VideoInfoResponse(BaseModel):
    title: str
    duration: int
    uploader: str
    youtube_url: str
    formats: list[Format]
    thumbnail: Optional[str] = None

class SliceSegmentRequest(BaseModel):
    start_time: int
    end_time: int
    format: Optional[str] = "mp4"
    quality: Optional[str] = None
    format_id: Optional[str] = None

class SliceTaskRequest(BaseModel):
    url: str
    quality: Optional[str] = "360p"
    format_id: Optional[str] = None
    segments: Optional[List[SliceSegmentRequest]] = None

class SegmentOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    download_id: str
    start_time: int
    end_time: int
    status: str
    format: str
    createdAt: float

class TaskOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    duration: int
    uploader: str
    youtube_url: str
    status: str
    createdAt: float
    user_id: Optional[str] = None
    segments: List[SegmentOutput] = []

    


