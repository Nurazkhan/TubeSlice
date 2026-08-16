from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os

from app.db.schema.download import (
    UrlRequest, VideoInfoResponse, SliceTaskRequest, TaskOutput, SegmentOutput
)
from app.db.schema.user import UserOutput
from app.service.download_service import DownloadService
from app.config.database import get_db
from app.util.protect_route import get_current_user, security_scheme
from fastapi.security import HTTPAuthorizationCredentials
from typing import Annotated

download_router = APIRouter(prefix="", tags=["Download"])


def optional_current_user(
    session: Session = Depends(get_db),
    authorization: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security_scheme)] = None,
) -> Optional[UserOutput]:
    if not authorization:
        return None
    return get_current_user(session=session, authorization=authorization)


@download_router.post("/info", response_model=VideoInfoResponse)
def get_video_info(payload: UrlRequest, session: Session = Depends(get_db)):
    """Extract metadata (title, duration, uploader) without downloading."""
    return DownloadService(session=session).fetch_video_info(payload.url)

@download_router.post("/slice", response_model=TaskOutput)
def create_slice_task(
    payload: SliceTaskRequest,
    session: Session = Depends(get_db),
    current_user: Optional[UserOutput] = Depends(optional_current_user),
):
    """Initiate full video download or slice into segments."""
    return DownloadService(session=session).create_slice_task(
        payload,
        user_id=current_user.id if current_user else None,
    )

@download_router.get("/my-downloads", response_model=list[TaskOutput])
def get_my_downloads(
    session: Session = Depends(get_db),
    current_user: UserOutput = Depends(get_current_user),
):
    """List all download tasks created by the logged-in user."""
    return DownloadService(session=session).get_user_downloads(current_user.id)

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


@download_router.post("/cookies")
async def upload_cookies(
    file: UploadFile = File(...),
    current_user: UserOutput = Depends(get_current_user),
):
    """Upload or update cookies.txt file for YouTube extraction.
    
    Only authenticated users can upload cookies.
    The cookies file is used to bypass age verification and other YouTube restrictions.
    
    Args:
        file: A Netscape format cookies.txt file
        
    Returns:
        Success message with file details
    """
    if file.filename != "cookies.txt":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be named 'cookies.txt'"
        )
    
    if file.content_type not in [None, "text/plain", "application/octet-stream"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a text file"
        )
    
    try:
   
        content = await file.read()
        
   
        if len(content) > 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Cookies file is too large (max 1MB)"
            )
        
     
        cookies_path = os.path.join("app", "cookies.txt")
        os.makedirs(os.path.dirname(cookies_path), exist_ok=True)
        

        with open(cookies_path, "wb") as f:
            f.write(content)
        
        return {
            "message": "Cookies file updated successfully",
            "file_size": len(content),
            "path": cookies_path,
            "updated_by": current_user.email
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save cookies file: {str(e)}"
        )


@download_router.delete("/cookies")
async def delete_cookies(current_user: UserOutput = Depends(get_current_user)):
    """Delete the cookies.txt file.
    
    Only authenticated users can delete cookies.
    This will fall back to yt-dlp's default behavior for YouTube extraction.
    """
    try:
        cookies_path = os.path.join("app", "cookies.txt")
        
        if os.path.exists(cookies_path):
            os.remove(cookies_path)
            return {
                "message": "Cookies file deleted successfully",
                "deleted_by": current_user.email
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cookies file does not exist"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete cookies file: {str(e)}"
        )
