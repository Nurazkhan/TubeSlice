from app.config.database import SessionLocal
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.worker import celery_app


@celery_app.task
def download_process(url: str, format: str, id: str):
    with SessionLocal() as session:
        DownloadService(session=session).change_status(id, "Processing")
        YoutubeAdapter.download(url,format)
        DownloadService(session=session).change_status(id, "Downloaded")