from .base import BaseRepository
from app.db.models.downloads import DownloadInstance, Segment

class downloadRepository(BaseRepository):
    def check_by_id(self, id: str):
        result = self.session.query(DownloadInstance).filter_by(id=id).first()
        return bool(result)

    def get_by_id(self, id: str):
        result = self.session.query(DownloadInstance).filter_by(id=id).first()
        return result

    def change_status_by_id(self, id: str, status: str):
        result = self.session.query(DownloadInstance).filter_by(id=id).first()
        if result:
            result.status = status
            self.session.commit()
            self.session.refresh(instance=result)
        return result

    def get_all_downloads(self):
        return self.session.query(DownloadInstance).all()

    def get_all_by_user_id(self, user_id: str):
        return self.session.query(DownloadInstance).filter_by(user_id=user_id).all()

class SegmentRepository(BaseRepository):
    def change_status_by_id(self, id: str, status: str) -> Segment:
        segment = self.session.query(Segment).filter_by(id=id).first()
        if segment:
            segment.status = status
            self.session.commit()
            self.session.refresh(instance=segment)
        return segment

    def get_segment_by_id(self, id: str) -> Segment:
        return self.session.query(Segment).filter_by(id=id).first()
