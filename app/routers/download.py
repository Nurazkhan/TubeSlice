from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from app.db.schema.download import downloadIn,downloadOutput, downloadSegmentIn, segmentOutput
from app.service.download_service import DownloadService
from app.adapter.youtube_download import YoutubeAdapter
from app.tasks.downloadTask import download_process, download_segment_process

from sqlalchemy.orm import Session
from app.config.database import get_db


download_router = APIRouter(tags=['Download'])
@download_router.post('/predownload')
def get_info(url: str, session: Session = Depends(get_db)):
    info = DownloadService(session=session).preDownload(url)
    return {'msg': f'{info}'}

@download_router.post('/download')
def download_from_url(payload: downloadIn, background_tasks: BackgroundTasks , session: Session = Depends(get_db)):
    
    download_scheme = DownloadService(session=session).log_download(payload)
    # create instances as Download and one segment in db, returns db output


    download_process.delay(url =payload.url, format = payload.format, download_id =download_scheme.id, segment_id = download_scheme.segments[0].id)
    return {'message': f'download info: {download_scheme}'}

@download_router.post('/segment')
def download_segments(payload: downloadSegmentIn, session: Session = Depends(get_db)):
    res: list[segmentOutput] = []
    for segment_info in payload.segments:
        segment_scheme = DownloadService(session = session).log_download_part(segment_info)
        download_segment_process.delay(url = payload.url, format = segment_scheme.format, download_id = segment_scheme.download_id
                               , segment_id = segment_scheme.id, start_time = segment_info.start_time, end_time = segment_info.end_time)
        res.append(segment_scheme)
    return {'msg':f'{res}'}
    

@download_router.get('/download/{id}')
def check_download(id: str, session: Session = Depends(get_db)):
    try:
        response = DownloadService(session=session).check_if_downloaded(id)
        if response.status == "Accepted":
            return {'message': f'Not downloaded yet \n full info here: {response}'}
        if response.status == "Downloaded":
            if len(response.segments) == 1:
                return FileResponse(path = f"app/downloads/{response.segments[0].id}.mp4", filename=response.title+'.mp4', media_type='application/octet-stream')
            else:
                return {'message': response}
    except Exception as error:
        print(error)
        raise error

@download_router.get('/all_downloads')
def get_all_downloads(session: Session = Depends(get_db)) -> list[downloadOutput]:
    return DownloadService(session=session).get_all_downloads()

@download_router.get('/segment/{id}')
def get_segment(id: str, session: Session = Depends(get_db)):
    result = DownloadService(session=session).get_segment_by_id(id)
    if result.status == 'Accepted':
        return {'message':'Your task is accepted wait until its ready',
                'data': f'{result}'}
    if result.status == 'Downloaded':
        return FileResponse(path = f"app/downloads/{result.id}.mp4",filename=f'{result.id}'+'.mp4', media_type='application/stream-octet' )
    if result.status == 'Processing':
        return{'message':'Your task is being downloaded wait',
                'data': f'{result}'}