from app.config.database import SessionLocal
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.worker import celery_app


@celery_app.task
def download_process(url: str, format: str, download_id: str, segment_id: str):
    with SessionLocal() as session:
        
        path = f'app/downloads/{segment_id}'
        DownloadService(session=session).change_status(download_id, "Processing")
        DownloadService(session = session).change_segment_status(segment_id, "Processing")
        YoutubeAdapter.download(url, path, format)
        DownloadService(session=session).change_status(download_id, "Downloaded")
        DownloadService(session= session).change_segment_status(segment_id, "Downloaded")
        
@celery_app.task
def download_segment_process(url: str, format: str, download_id: str, segment_id: str, start_time: int, end_time: int):
    with SessionLocal() as session:
            
            path = f'app/downloads/{segment_id}'
            DownloadService(session=session).change_status(download_id, "Processing")
            DownloadService(session = session).change_segment_status(segment_id, "Processing")
            YoutubeAdapter.download_segment(url, path, start_time,end_time,format)
            DownloadService(session=session).change_status(download_id, "Downloaded")
            DownloadService(session= session).change_segment_status(segment_id, "Downloaded")