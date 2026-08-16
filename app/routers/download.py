from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.db.schema.download import (
    UrlRequest, VideoInfoResponse, SliceTaskRequest, TaskOutput, SegmentOutput
)
from app.service.download_service import DownloadService
from app.config.database import get_db

download_router = APIRouter(prefix="", tags=["Download"])

@download_router.post("/info", response_model=VideoInfoResponse)
def get_video_info(payload: UrlRequest, session: Session = Depends(get_db)):
    """Extract metadata (title, duration, uploader) without downloading."""
    return DownloadService(session=session).fetch_video_info(payload.url)

@download_router.post("/slice", response_model=TaskOutput)
def create_slice_task(payload: SliceTaskRequest, session: Session = Depends(get_db)):
    """Initiate full video download or slice into segments."""
    return DownloadService(session=session).create_slice_task(payload)

@download_router.get("/status/{task_id}", response_model=TaskOutput)
def get_task_status(task_id: str, session: Session = Depends(get_db)):
    """Check task execution status."""
    return DownloadService(session=session).get_task_by_id(task_id)

@download_router.get("/segment/{segment_id}")
def get_segment_status_or_file(segment_id: str, session: Session = Depends(get_db)):
    """Check status of a segment or return stream if ready."""
    service = DownloadService(session=session)
    segment = service.get_segment_by_id(segment_id)

    if segment.status == "Downloaded":
        file_path = os.path.join("app", "downloads", f"{segment_id}.mp4")
        if os.path.exists(file_path):
            return FileResponse(
                path=file_path,
                filename=f"slice_{segment_id}.mp4",
                media_type="video/mp4"
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File missing on disk"
        )
    return segment

@download_router.get("/download/{segment_id}")
def download_file(segment_id: str):
    """Directly stream the downloaded MP4 segment file."""
    file_path = os.path.join("app", "downloads", f"{segment_id}.mp4")
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=f"slice_{segment_id}.mp4",
            media_type="video/mp4"
        )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="File not found or processing incomplete"
    )

@download_router.get("/all_downloads", response_model=list[TaskOutput])
def get_all_downloads(session: Session = Depends(get_db)):
    """Retrieve history of all tasks."""
    return DownloadService(session=session).get_all_tasks()