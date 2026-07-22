from sqlalchemy.orm import Session
from app.db.repository.download import downloadRepository
from app.db.schema.download import downloadIn, downloadInstanceIn
from app.adapter.youtube_download import YoutubeAdapter
from fastapi import HTTPException, status, BackgroundTasks
class DownloadService:
    def __init__(self, session : Session):
        self.__downloadRepository = downloadRepository(session = session)

    def download_video(self, payload: downloadIn ):
        try:
            info = YoutubeAdapter.get_info(payload['url'])
            title, duration, uploader = info.get('title'),info.get('duration'),info.get('uploader') 

            payload_to_scheme = downloadInstanceIn(
                title= title,
                duration= duration,
                uploader= uploader,
                youtube_url = payload['url'],
                download_url= f'../downloads/{title}.mp4',
                status= 'Accepted',
                format = payload['format']
            )
            return self.__downloadRepository.download(payload_to_scheme)

        except:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    
