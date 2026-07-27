from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from app.db.schema.download import downloadIn,downloadOutput
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.tasks.downloadTask import download_process

from sqlalchemy.orm import Session
from app.config.database import get_db


download_router = APIRouter(tags=['Download'])

# def download_process(url: str, format: str, session: Session, id: str):
#     DownloadService(session=session).change_status(id, "Processing")
#     YoutubeAdapter.download(url,format)
#     DownloadService(session=session).change_status(id, "Downloaded")


@download_router.post('/download')
def download_from_url(payload: downloadIn, background_tasks: BackgroundTasks , session: Session = Depends(get_db)):
    
    download_scheme = DownloadService(session=session).log_download(payload)
    download_process.delay(url =payload.url, format = payload.format, id = download_scheme.id)
    # background_tasks.add_task(lambda : download_process(payload.url, payload.format, session, download_scheme.id))
    return {'message': f'download info: {download_scheme}'}

@download_router.get('/download/{id}')
def check_download(id: str, session: Session = Depends(get_db)):
    try:
        response = DownloadService(session=session).check_if_downloaded(id)
        if response.status == "Accepted":
            return {'message': f'Not downloaded yet \n full info here: {response}'}
        if response.status == "Downloaded":
            return FileResponse(path = response.download_url, filename=response.title+'.mp4', media_type='application/octet-stream')
    except Exception as error:
        print(error)
        raise error

@download_router.get('/all_downloads')
def get_all_downloads(session: Session = Depends(get_db)) -> list[downloadOutput]:
    return DownloadService(session=session).get_all_downloads()

