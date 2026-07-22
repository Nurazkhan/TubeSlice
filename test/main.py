import yt_dlp

def download_video(url, output_path='downloads'):
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'outtmpl': f'{output_path}/%(title)s.%(ext)s',
        'quiet': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

if __name__ == '__main__':
    download_video('https://www.youtube.com/watch?v=dQw4w9WgXcQ')