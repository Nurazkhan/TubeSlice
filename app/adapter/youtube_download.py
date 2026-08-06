import yt_dlp
from yt_dlp.utils import DownloadError, ExtractorError, download_range_func
from typing import Union

class YoutubeAdapter:
    @staticmethod
    def download(url: str, path: str, quality: str = '360p' ) -> str:
       
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
    def download_segment(url: str, path: str, start_time:int, end_time:int, quality: str = 'worstvideo+worstaudio/worst') -> str:
        ydl_opts: dict[str, Union[str, bool]] = {
                    'format': f'{quality}',

                    'download_ranges': download_range_func(None, [(start_time,end_time)]),
                    'force_keyframes_at_cuts':False,
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

