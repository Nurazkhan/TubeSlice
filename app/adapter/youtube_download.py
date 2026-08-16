import yt_dlp
from yt_dlp.utils import DownloadError, ExtractorError, download_range_func
from typing import Union, Optional, Dict, Any
import os

COOKIES_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cookies.txt')

COMMON_OPTS: Dict[str, Any] = {
    'cookiefile': 'app/cookies.txt',
    'extractor_args': {
        'youtube': {
            'player_client': ['android', 'web'],
        }
    },
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

class YoutubeAdapter:
    @staticmethod
    def resolve_format_selector(format_id: Optional[str] = None, quality: Optional[str] = None) -> str:
        if format_id:
            return str(format_id)

        if not quality:
            return 'best'

        quality_value = str(quality).strip()
        if quality_value.endswith('p') and quality_value[:-1].isdigit():
            height = quality_value[:-1]
            return f'bestvideo[height={height}]+bestaudio/best[height={height}]'

        return quality_value

    @staticmethod
    def get_info(url: str) -> Optional[Dict[str, Any]]:
        ydl_opts = {
            'cookiefile': 'app/cookies.txt',
            'skip_download': True,
            'noplaylist': True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return info
        except Exception as e:
            print(f"Extraction Error for {url}: {e}")
            return None

    @staticmethod
    def download_segment(
        url: str,
        path: str,
        start_time: int,
        end_time: int,
        quality: str = '360p',
        format_id: Optional[str] = None,
    ) -> bool:
        if not os.path.dirname(path):
            os.makedirs(os.path.dirname(path), exist_ok=True)

        ydl_opts = {
            'cookiefile': 'app/cookies.txt',
            'format': YoutubeAdapter.resolve_format_selector(format_id=format_id, quality=quality),
            'download_ranges': download_range_func(None, [(start_time, end_time)]),
            'force_keyframes_at_cuts': True,
            'outtmpl': path,
            'quiet': False,
            'merge_output_format': 'mp4',
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            return True
        except Exception as e:
            print(f"Download Segment Failed: {e}")
            return False


