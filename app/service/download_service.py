from sqlalchemy.orm import Session
from app.db.repository.download import downloadRepository
from app.db.schema.download import downloadIn, downloadInstanceIn, downloadOutput
from app.adapter.youtube_download import YoutubeAdapter
from fastapi import HTTPException, status
class DownloadService:
    def __init__(self, session : Session):
        self.__downloadRepository = downloadRepository(session = session)

    def download_video(self, payload: downloadIn ):
        try:
            info = YoutubeAdapter.get_info(payload.url)
            if not info:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'error extracting info')
            title, duration, uploader, ext = info.get('title'),info.get('duration'),info.get('uploader'), info.get('ext')

            payload_to_scheme = downloadInstanceIn(
                title= title,
                duration= duration,
                uploader= uploader,
                youtube_url = payload.url,
                download_url= f'app/downloads/{title}.mp4',
                status= 'Accepted',
                format = payload.format
            )
            return self.__downloadRepository.download(payload_to_scheme)

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"error: {e}")

    def change_status(self, id:str, status: str):
        return self.__downloadRepository.change_status_by_id(id, status)

    def check_if_downloaded(self, id: str) -> downloadOutput:
        result = self.__downloadRepository.check_by_id(id)

        if result:
            instance = self.__downloadRepository.get_by_id(id)
            instance = downloadOutput.model_validate(instance)
            return instance
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ID not found in database record")

    def get_all_downloads(self) -> list[downloadOutput]:
        result = self.__downloadRepository.get_all_downloads()
        response = [downloadOutput.model_validate(item) for item in result]
        return response
