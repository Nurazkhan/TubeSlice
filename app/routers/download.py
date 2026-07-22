from fastapi import APIRouter, Depends, BackgroundTasks
from app.db.schema.download import downloadIn,downloadOutput
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter

from sqlalchemy.orm import Session
from app.config.database import get_db


download_router = APIRouter()

@download_router.post('/download')
def download_from_url(payload: downloadIn, background_tasks: BackgroundTasks , session: Session = Depends(get_db)):
    background_tasks.add_task(lambda :YoutubeAdapter.download(payload['url']))
    download_orm = DownloadService(session=session).download_video(payload)
    download_scheme = downloadOutput.model_validate(download_orm)
    return {'message': f'download info: {download_scheme}'}

