# TubeSlice

![FastAPI](https://img.shields.io/badge/FastAPI-333333?logo=fastapi)
![Redis Badge](https://img.shields.io/badge/Redis-333333?logo=redis)
![PostgreSQL Badge](https://img.shields.io/badge/PostgreSQL-333333?logo=postgresql)
![celery Badge](https://img.shields.io/badge/Celery-333333?logo=celery)
![Next.js Badge](https://img.shields.io/badge/Next.js-333333?logo=nextdotjs)
![YT Badge](https://img.shields.io/badge/Youtube-333333?logo=youtube)


You can try the app by this [link](https://tube-slice-six.vercel.app/)

*P.S: It works very slow due to cheap VPS. Download might take 10 minutes, or significantly more dependent on video duration and resolution*

A REST API for downloading and slicing YouTube videos by time range and resolution.
![alt text](image.png)

## Video
![gif](tubeslice3.gif)





---
---


## Features

- **Download by segment** - download only the part of the video you need.
- **Select Resolution** - all available resolution from(144p-4K) you can select any of them.
- **Task queue** - Using Celery + Redis downloads video even if you leave website.
- **Download History** - JWT-based auth; track download history per user
- **Metadata extraction** - Get video info, available formats, and segment availability before downloading


### Requirements

- Python 3.11+
- PostgreSQL 
- Redis 
- FFmpeg 

### Installation & Run
The way I use it myself.
```
#first activate venv
.venv/Scripts/activate

then run redis and postgres and celery
docker run --name redis -p 6379:6379 -d redis
docker run --name tubeslice-db -e POSTGRES_USER=User -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
celery -A app.worker.celery_app worker -l info -P solo

#well change tempate user and password and also make sure to edit the backend/app/config/database/database_url

#after that just run fast api
uvicorn main:app --port 8080 --reload

after that run frontend.
just npm install
and npm run dev.


also, to avoid getting blocked by youtube rotate your ip using proxies, and adding cookies.txt  to backend/app folder is recommended for better use.

I hope it is helpful, if not sorry!
```

The API will be available at **http://localhost:8080**  
Swagger UI: **http://localhost:8080/docs**

### Running the Frontend

The frontend is a Next.js application in the `tubeslice_front/` directory.

```bash
cd tubeslice_front
npm install
npm run dev
```

The frontend will be available at **http://localhost:3000**

### Environment Setup

1. Create a `.env` 
   ```
   DATABASE_URL=postgresql://user:password@localhost/tubeslice
   REDIS_URL=redis://localhost:6379
   SECRET_KEY=your-secret-key-here
   ```


### Core Endpoints

- `POST /info` - Get video metadata and available formats
- `POST /slice` - Create a download task for a time segment
- `GET /my-downloads` - Fetch your download history (requires auth)
- `GET /status/{task_id}` - Check download progress
- `GET /segment/{segment_id}` - Retrieve a completed segment

## How It Works

**TubeSlice** uses:

- **FastAPI** - High-performance REST framework for route handling and validation
- **yt-dlp** - YouTube extraction with fallback logic for restricted videos and cookie-based auth
- **Celery + Redis** - Async task queue for background downloads without blocking the API
- **SQLAlchemy + PostgreSQL** - Persistent task and user storage
- **JWT authentication** - Token-based auth with per-user download tracking

## Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Celery](https://docs.celeryproject.io/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [FFmpeg](https://ffmpeg.org/)




P.S: I did spend a lot of time on backend, doing it myself, as I was learning. But, I have to admit that frontend was done with the help of Codex.
