from app.config.database import SessionLocal
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.worker import celery_app
import os
from typing import Optional

@celery_app.task
def download_segment_process(
    url: str,
    quality: str,
    download_id: str,
    segment_id: str,
    start_time: int,
    end_time: int,
    format_id: Optional[str] = None,
):
    with SessionLocal() as session:
        service = DownloadService(session=session)
        service.change_status(download_id, "Processing")
        service.change_segment_status(segment_id, "Processing")

        target_dir = os.path.join("app", "downloads")
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, f"{segment_id}.mp4")

        success = YoutubeAdapter.download_segment(
            url=url,
            path=file_path,
            start_time=start_time,
            end_time=end_time,
            quality=quality,
            format_id=format_id,
        )

        if success:
            service.change_segment_status(segment_id, "Downloaded")
            service.change_status(download_id, "Downloaded")
        else:
            service.change_segment_status(segment_id, "Failed")
            service.change_status(download_id, "Failed")
