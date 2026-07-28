from app.config.database import SessionLocal
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.worker import celery_app


@celery_app.task
def download_process(url: str, format: str, download_id: str, segment_id: str):
    with SessionLocal() as session:
        
        path = f'app/downloads/segments/{segment_id}.%(ext)s'
        DownloadService(session=session).change_status(download_id, "Processing")
        DownloadService(session = session).change_segment_status(segment_id, "Processing")
        YoutubeAdapter.download(url, path, format)
        DownloadService(session=session).change_status(download_id, "Downloaded")
        DownloadService(session= session).change_segment_status(segment_id, "Processing")