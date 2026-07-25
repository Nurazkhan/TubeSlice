import yt_dlp
from yt_dlp.utils import DownloadError, ExtractorError
from typing import Union

class YoutubeAdapter:
    @staticmethod
    def download(url: str, quality: str = '360p') -> str:
        path = f'app/downloads/%(title)s.%(ext)s'
        ydl_opts: dict[str, Union[str, bool]] = {
            'format': f'{quality}',
            'outtmpl': path,
            'quiet': False,
            'merge_output_format': 'mp4'
        }


        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            return path
        except DownloadError as e:
            return f'Download Failed: {e}' 
        except ExtractorError as e:
            return f'Extraction failed {e}'
       
    @staticmethod
    def get_info(url: str):
        ydl_opts: dict[str, bool] = {
            'skip_download' : True
            }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download= False)
                return info
        except ExtractorError as e:
            print("ExtractorError: ", e)
            return None
        except DownloadError as e:
            print("Download Error: ",e)
            return None

