import yt_dlp
from yt_dlp.utils import DownloadError, ExtractorError, download_range_func
from typing import Union, Optional, Dict, Any
import os

COOKIES_PATH = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cookies.txt'))

COMMON_OPTS: Dict[str, Any] = {
    'cookiefile': COOKIES_PATH if os.path.exists(COOKIES_PATH) else None,
    'socket_timeout': 15,
    'source_address': '0.0.0.0',
    'extractor_args': {
        'youtube': {
            'player_client': ['mweb', 'android', 'web', 'ios'],
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
    def _build_info_options(use_cookie: bool = True, client_order: Optional[list[str]] = None) -> Dict[str, Any]:
        clients = client_order or ['mweb', 'android', 'web', 'ios']
        options: Dict[str, Any] = {
            'skip_download': True,
            'noplaylist': True,
            'socket_timeout': 10,
            'source_address': '0.0.0.0',
            'extractor_args': {
                'youtube': {
                    'player_client': clients,
                }
            },
            'quiet': False,
            'no_warnings': False,
        }
        if use_cookie and os.path.exists(COOKIES_PATH):
            options['cookiefile'] = COOKIES_PATH
        return options

    @staticmethod
    def get_info(url: str) -> Optional[Dict[str, Any]]:
        strategies = [
            (True, ['mweb', 'android', 'ios']),
            (False, ['mweb', 'android', 'ios']),
            (True, ['web', 'android']),
            (False, ['web', 'android']),
        ]

        last_error = None
        for use_cookie, clients in strategies:
            ydl_opts = YoutubeAdapter._build_info_options(use_cookie=use_cookie, client_order=clients)
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    if info:
                        return info
            except Exception as e:
                last_error = e
                print(f"Extraction Error for {url} with clients {clients}: {e}")

        if last_error:
            print(f"All extraction attempts failed for {url}: {last_error}")
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
        os.makedirs(os.path.dirname(path), exist_ok=True)

        strategies = [
            (True, ['mweb', 'android', 'ios']),
            (False, ['mweb', 'android', 'ios']),
            (True, ['web', 'android']),
            (False, ['web', 'android']),
        ]

        last_error = None
        for use_cookie, clients in strategies:
            ydl_opts = {
                'format': YoutubeAdapter.resolve_format_selector(format_id=format_id, quality=quality),
                'download_ranges': download_range_func(None, [(start_time, end_time)]),
                'force_keyframes_at_cuts': True,
                'outtmpl': path,
                'quiet': False,
                'socket_timeout': 15,
                'source_address': '0.0.0.0',
                'merge_output_format': 'mp4',
                'extractor_args': {
                    'youtube': {'player_client': clients}
                },
            }
            if use_cookie and os.path.exists(COOKIES_PATH):
                ydl_opts['cookiefile'] = COOKIES_PATH

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                return True
            except Exception as e:
                last_error = e
                print(f"Download Segment Failed with client set {clients}: {e}")

        print(f"All download attempts failed for {url}: {last_error}")
        return False


