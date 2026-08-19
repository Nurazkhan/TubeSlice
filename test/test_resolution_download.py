from backend.app.adapter.youtube_download import YoutubeAdapter
from backend.app.service.download_service import DownloadService


def test_resolve_format_selector_uses_format_id():
    assert YoutubeAdapter.resolve_format_selector(format_id="136", quality=None) == "136"


def test_resolve_format_selector_uses_quality_label():
    assert (
        YoutubeAdapter.resolve_format_selector(format_id=None, quality="720p")
        == "bestvideo[height=720]+bestaudio/best[height=720]"
    )


def test_fetch_video_info_parses_resolution_fields(monkeypatch):
    sample_info = {
        "title": "Sample Title",
        "duration": 123,
        "uploader": "Sample Uploader",
        "thumbnail": "https://example.com/thumb.jpg",
        "formats": [
            {
                "format_id": "18",
                "ext": "mp4",
                "resolution": "640x360",
                "format_note": "360p",
                "width": 640,
                "height": 360,
            }
        ],
    }

    monkeypatch.setattr(YoutubeAdapter, "get_info", lambda url: sample_info)
    service = DownloadService.__new__(DownloadService)

    info = service.fetch_video_info("https://example.com/watch?v=abc")

    assert info.title == "Sample Title"
    assert info.formats[0].resolution == "640x360"
    assert info.formats[0].format_id == "18"
