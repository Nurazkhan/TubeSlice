import os
from typing import Any, Optional

import yt_dlp
from yt_dlp.utils import DownloadError, ExtractorError, download_range_func


COOKIES_PATH = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "cookies.txt")
)


class YoutubeAdapter:
    @staticmethod
    def _cookie_options() -> dict[str, str]:
        if os.path.exists(COOKIES_PATH):
            return {"cookiefile": COOKIES_PATH}
        return {}

    @staticmethod
    def resolve_format_selector(format_id: Optional[str] = None, quality: Optional[str] = None) -> str:
        if format_id:
            return str(format_id)

        if not quality:
            return "best"

        quality = str(quality).strip()
        if quality.endswith("p") and quality[:-1].isdigit():
            height = quality[:-1]
            return f"bestvideo[height={height}]+bestaudio/best[height={height}]"

        return quality

    @staticmethod
    def download(url: str, path: str, quality: str = "360p") -> str:
        os.makedirs(os.path.dirname(path), exist_ok=True)

        ydl_opts: dict[str, Any] = {
            "format": YoutubeAdapter.resolve_format_selector(quality=quality),
            "outtmpl": path,
            "quiet": False,
            "merge_output_format": "mp4",
            **YoutubeAdapter._cookie_options(),
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            return path
        except DownloadError as e:
            return f"Download Failed: {e}"
        except ExtractorError as e:
            return f"Extraction failed {e}"

    @staticmethod
    def download_segment(
        url: str,
        path: str,
        start_time: int,
        end_time: int,
        quality: str = "360p",
        format_id: Optional[str] = None,
    ) -> bool:
        os.makedirs(os.path.dirname(path), exist_ok=True)

        ydl_opts: dict[str, Any] = {
            "format": YoutubeAdapter.resolve_format_selector(format_id=format_id, quality=quality),
            "download_ranges": download_range_func(None, [(start_time, end_time)]),
            "force_keyframes_at_cuts": False,
            "outtmpl": path,
            "quiet": False,
            "merge_output_format": "mp4",
            **YoutubeAdapter._cookie_options(),
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            return True
        except DownloadError as e:
            print(f"Download Failed: {e}")
            return False
        except ExtractorError as e:
            print(f"Extraction failed {e}")
            return False

    @staticmethod
    def get_info(url: str) -> Optional[dict[str, Any]]:
        ydl_opts: dict[str, Any] = {
            "skip_download": True,
            "quiet": False,
            **YoutubeAdapter._cookie_options(),
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
        except ExtractorError as e:
            print("ExtractorError: ", e)
            return None
        except DownloadError as e:
            print("Download Error: ", e)
            return None
