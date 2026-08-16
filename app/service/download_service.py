from sqlalchemy.orm import Session
from app.db.repository.download import downloadRepository, SegmentRepository
from app.db.schema.download import (
    VideoInfoResponse, SliceTaskRequest, SliceSegmentRequest, TaskOutput, SegmentOutput, Format
)
from app.db.models.downloads import DownloadInstance, Segment

from app.adapter.youtube_download import YoutubeAdapter
from fastapi import HTTPException, status
from typing import List, Optional
from app.logger import logger

class DownloadService:
    def __init__(self, session: Session):
        self.__download_repo = downloadRepository(session=session)
        self.__segment_repo = SegmentRepository(session=session)

    def fetch_video_info(self, url: str) -> VideoInfoResponse:
        info = YoutubeAdapter.get_info(url)
        if not info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to extract video details from the provided URL"
            )

        formats: list[Format] = []
        for f in info.get('formats', []):
            format_id = f.get('format_id')
            ext = f.get('ext')
            resolution = f.get('resolution') or (
                f"{f.get('width')}x{f.get('height')}" if f.get('width') and f.get('height') else 'audio only'
            )
            note = f.get('format_note')
            formats.append(
                Format(
                    format_id=str(format_id) if format_id is not None else '',
                    ext=ext or '',
                    resolution=resolution,
                    note=note,
                )
            )

        return VideoInfoResponse(
            title=info.get('title', 'Unknown Title'),
            duration=int(info.get('duration') or 0),
            uploader=info.get('uploader', 'Unknown Uploader'),
            youtube_url=url,
            formats=formats,
            thumbnail=info.get('thumbnail')
        )

    def create_slice_task(self, payload: SliceTaskRequest) -> TaskOutput:
        info = self.fetch_video_info(payload.url)

        new_download = DownloadInstance(
            title=info.title,
            duration=info.duration,
            uploader=info.uploader,
            youtube_url=info.youtube_url,
            status='Accepted'
        )
        self.__download_repo.session.add(new_download)
        self.__download_repo.session.commit()
        self.__download_repo.session.refresh(new_download)

        default_quality = payload.quality or '360p'
        default_format_id = payload.format_id
        segments_to_create = payload.segments if payload.segments else [
            {
                "start_time": 0,
                "end_time": info.duration,
                "format": payload.quality or payload.format_id or "mp4",
                "quality": default_quality,
                "format_id": default_format_id,
            }
        ]

        created_segments = []
        from app.tasks.downloadTask import download_segment_process

        for seg in segments_to_create:
            if isinstance(seg, SliceSegmentRequest):
                start_t = seg.start_time
                end_t = seg.end_time
                fmt = seg.format or "mp4"
                quality = seg.quality or payload.quality or '360p'
                selected_format_id = seg.format_id or payload.format_id
            else:
                start_t = seg.get('start_time', 0)
                end_t = seg.get('end_time', info.duration)
                fmt = seg.get('format', 'mp4')
                quality = seg.get('quality') or payload.quality or '360p'
                selected_format_id = seg.get('format_id') or payload.format_id

            segment_label = selected_format_id or quality or fmt
            segment_model = Segment(
                download_id=new_download.id,
                start_time=start_t,
                end_time=end_t,
                format=segment_label,
                status='Accepted'
            )

            self.__segment_repo.session.add(segment_model)
            self.__segment_repo.session.commit()
            self.__segment_repo.session.refresh(segment_model)

            download_segment_process.delay(
                url=payload.url,
                quality=quality,
                format_id=selected_format_id,
                download_id=new_download.id,
                segment_id=segment_model.id,
                start_time=start_t,
                end_time=end_t,
            )

            created_segments.append(SegmentOutput.model_validate(segment_model))

        task_output = TaskOutput.model_validate(new_download)
        task_output.segments = created_segments
        return task_output

    def get_task_by_id(self, task_id: str) -> TaskOutput:
        task = self.__download_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return TaskOutput.model_validate(task)

    def get_segment_by_id(self, segment_id: str) -> SegmentOutput:
        segment = self.__segment_repo.get_segment_by_id(segment_id)
        if not segment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found")
        return SegmentOutput.model_validate(segment)

    def change_segment_status(self, segment_id: str, new_status: str):
        return self.__segment_repo.change_status_by_id(segment_id, new_status)

    def change_status(self, download_id: str, new_status: str):
        return self.__download_repo.change_status_by_id(download_id, new_status)

    def get_all_tasks(self) -> List[TaskOutput]:
        tasks = self.__download_repo.get_all_downloads()
        return [TaskOutput.model_validate(t) for t in tasks]

