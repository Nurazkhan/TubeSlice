from .base import BaseRepository
from app.db.schema.download import downloadInstanceIn
from app.db.models.downloads import DownloadInstance

class downloadRepository(BaseRepository):
    def download(self,payload: downloadInstanceIn):
        new_download = DownloadInstance(
            title= payload.title,
            duration = payload.duration,
            uploader = payload.uploader,
            youtube_url = payload.youtube_url,
            download_url = payload.download_url,
            status = payload.status,
            user_id = None,
            format = payload.format
        )
        self.session.add(instance=new_download)
        self.session.commit()
        self.session.refresh(instance=new_download)
        return new_download

    def check_by_id(self, id: str):
        result = self.session.query(DownloadInstance).filter_by(id = id).first()
        return bool(result)

    def get_by_id(self, id:str):
        result = self.session.query(DownloadInstance).filter_by(id= id).first()
        return result

    def change_status_by_id(self, id: str, status:str):
        result = self.session.query(DownloadInstance).filter_by(id = id).first()
        if result:
            result.status = status
            self.session.commit()
            self.session.refresh(instance = result)
        return result

    def get_all_downloads(self):
        return self.session.query(DownloadInstance).all()

        