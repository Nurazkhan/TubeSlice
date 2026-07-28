from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from app.db.schema.download import downloadIn,downloadOutput
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.tasks.downloadTask import download_process

from sqlalchemy.orm import Session
from app.config.database import get_db


download_router = APIRouter(tags=['Download'])


@download_router.post('/download')
def download_from_url(payload: downloadIn, background_tasks: BackgroundTasks , session: Session = Depends(get_db)):
    
    download_scheme = DownloadService(session=session).log_download(payload)
    # create instances as Download and one segment in db, returns db output


    download_process.delay(url =payload.url, format = payload.format, download_id =download_scheme.id, segment_id = download_scheme.segments[0].id)
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

# @download_router.post('/downloadPart')
# def download_segment(payload: downloadPartIn, session: Session = Depends(get_db)):
#     log = 