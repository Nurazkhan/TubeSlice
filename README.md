# TubeSlice

![FastAPI](https://img.shields.io/badge/FastAPI-333333?logo=fastapi)
![Redis Badge](https://img.shields.io/badge/Redis-333333?logo=redis)
![PostgreSQL Badge](https://img.shields.io/badge/PostgreSQL-333333?logo=postgresql)
![celery Badge](https://img.shields.io/badge/Celery-333333?logo=celery)
![Next.js Badge](https://img.shields.io/badge/Next.js-333333?logo=nextdotjs)
![YT Badge](https://img.shields.io/badge/Youtube-333333?logo=youtube)



A REST API for downloading and slicing YouTube videos by time range and resolution.
![alt text](tubeslice1.png)

## Video
![gif](tubeslice3.gif)




Unfortunately, I can't deploy it due to ToS regulations, and due to absence of funding for vps. Yet You can ran it locally if needed.
---
---
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

# AI generated instructions and information.
### Actually, it can be helpful as It has executable script that can run all automatically on your machine. and info
---


## Features

- **Download by segment** — Extract a specific time range from any YouTube video
- **Resolution selection** — Choose exact video quality (4K, 720p, 480p, etc.) or auto-fallback to best available
- **Async task queue** — Background downloads via Celery + Redis
- **User authentication** — JWT-based auth; track download history per user
- **Download tracking** — View all your downloads after login
- **Metadata extraction** — Get video info, available formats, and segment availability before downloading

## Quick Start

### Requirements

- Python 3.11+
- PostgreSQL (local or Docker)
- Redis (local or Docker)
- FFmpeg (for segment processing)

### Installation & Run

#### Windows
```powershell
# Clone the repo
git clone <repo-url>
cd TubesliceBackend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start services (Docker + backend)
.\start-dev.ps1
```

#### macOS / Linux
```bash
# Clone the repo
git clone <repo-url>
cd TubesliceBackend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start services (Docker + backend)
bash start-dev.sh
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

## How to Run Locally

### Dependencies

1. **PostgreSQL**  
   The backend expects a Postgres instance. The startup scripts handle Docker setup.

2. **Redis**  
   Celery uses Redis as the message broker. The startup scripts handle Docker setup.

3. **FFmpeg**  
   Required for segment extraction.
   - **Windows**: Install via [ffmpeg.org](https://ffmpeg.org/download.html) or `choco install ffmpeg`
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt-get install ffmpeg`

### Environment Setup

1. Create a `.env` file (or copy from `.env.example`):
   ```
   DATABASE_URL=postgresql://user:password@localhost/tubeslice
   REDIS_URL=redis://localhost:6379
   SECRET_KEY=your-secret-key-here
   ```

2. Start services with the provided script:
   - **Windows**: `.\start-dev.ps1`
   - **macOS/Linux**: `bash start-dev.sh`

3. Access the API:
   - Base URL: `http://localhost:8080`
   - Docs: `http://localhost:8080/docs`

### Core Endpoints

- `POST /info` — Get video metadata and available formats
- `POST /slice` — Create a download task for a time segment
- `GET /my-downloads` — Fetch your download history (requires auth)
- `GET /status/{task_id}` — Check download progress
- `GET /segment/{segment_id}` — Retrieve a completed segment

## How It Works

**TubeSlice** uses:

- **FastAPI** — High-performance REST framework for route handling and validation
- **yt-dlp** — YouTube extraction with fallback logic for restricted videos and cookie-based auth
- **Celery + Redis** — Async task queue for background downloads without blocking the API
- **SQLAlchemy + PostgreSQL** — Persistent task and user storage
- **JWT authentication** — Token-based auth with per-user download tracking

The architecture separates metadata extraction (synchronous info calls) from actual downloads (queued tasks). Each user's downloads are isolated and queryable via authenticated endpoints.

## Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Celery](https://docs.celeryproject.io/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [FFmpeg](https://ffmpeg.org/)




P.S: I did spend a lot of time on backend, doing it myself, as I was learning. But, I have to admit that frontend was completely done with Codex.

actually I wanted to deploy ad billing and earn on this project. But, I didn't expect it violating ToS, so now it open source and can ran on your local machines.