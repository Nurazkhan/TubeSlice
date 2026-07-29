from sqlalchemy.orm import Session
from app.db.repository.download import downloadRepository, SegmentRepository
from app.db.schema.download import downloadIn, downloadInstanceIn, downloadOutput, segmentIn, segmentOutput
from app.adapter.youtube_download import YoutubeAdapter
from fastapi import HTTPException, status
class DownloadService:
    def __init__(self, session : Session):
        self.__downloadRepository = downloadRepository(session = session)
        self.__SegmentRepository = SegmentRepository(session=session)

    def preDownload(self, url: str) -> downloadOutput:
        try:
            info = YoutubeAdapter.get_info(url)
            if not info:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'error extracting info')
            title, duration, uploader, ext = info.get('title'),info.get('duration'),info.get('uploader'), info.get('ext')
            
            payload_to_scheme = downloadInstanceIn(
                title= title,
                duration= duration,
                uploader= uploader,
                youtube_url = url,
                status= 'Accepted',
            )

            result = self.__downloadRepository.download(payload_to_scheme)
            return downloadOutput.model_validate(result)
        except Exception as e:
                    import traceback
                    traceback.print_exc()
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"error at preDownload: {e}")

    def log_download(self, payload: downloadIn ) -> downloadOutput:
        try:
            result = downloadOutput.model_validate(self.__downloadRepository.get_by_id(payload.download_id))

            log_scheme = segmentIn(
                download_id= payload.download_id,
                start_time= 0,
                end_time = result.duration,
                format = payload.format,
            )
            result_segment = self.log_download_part(log_scheme)
            result.segments.append(result_segment)

            return result

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"error at log download: {e}")

    def log_download_part(self, payload: segmentIn) -> segmentOutput:
        try:
            result = self.__SegmentRepository.create_segment(payload)
            print(result)
            return segmentOutput.model_validate(result)
        except Exception as error:
            print(error)
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Napisal ya: error at service: log_download_part: {error}")

    def get_segment_by_id(self, id: str)->segmentOutput:
        segmentORM = self.__SegmentRepository.get_segment_by_id(id)
        return segmentOutput.model_validate(segmentORM)
    def change_segment_status(self, segment_id: str, status: str)-> segmentOutput:
        segment_orm = self.__SegmentRepository.change_status_by_id(segment_id, status)
        return segmentOutput.model_validate(segment_orm)
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
