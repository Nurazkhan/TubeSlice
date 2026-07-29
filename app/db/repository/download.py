from .base import BaseRepository
from app.db.schema.download import downloadInstanceIn, segmentIn
from app.db.models.downloads import DownloadInstance, Segment

class downloadRepository(BaseRepository):
    def download(self,payload: downloadInstanceIn):
        new_download = DownloadInstance(
            **payload.model_dump()
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

class SegmentRepository(BaseRepository):
    def create_segment(self, payload: segmentIn) -> Segment:
        new_segment = Segment(**payload.model_dump())
        self.session.add(instance = new_segment)
        self.session.commit()
        self.session.refresh(instance = new_segment)
        return new_segment
    def change_status_by_id(self, id: str, status:str) -> Segment:
        segment = self.session.query(Segment).filter_by(id = id).first()
        if segment:
            segment.status = status
            self.session.commit()
            self.session.refresh(instance = segment)
        return segment
    def get_segment_by_id(self, id:str) -> Segment:
        return self.session.query(Segment).filter_by(id =id).first()