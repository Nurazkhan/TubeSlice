# TubeSlice Backend

TubeSlice is a FastAPI backend for downloading and slicing YouTube videos using yt-dlp, Celery, Redis, and PostgreSQL.

## Quick start

### Windows

Run the PowerShell script:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

### macOS / Linux

Run the bash script:

```bash
chmod +x ./start-dev.sh
./start-dev.sh
```

These scripts will:
- create the Python virtual environment if it does not exist
- install dependencies
- start PostgreSQL in Docker
- start Redis in Docker
- start the Celery worker
- start the FastAPI app

## API and documentation

After the app is running, you can open the Swagger UI here:

- http://localhost:8080/docs

This is the interactive API documentation for the backend, including the download and slice endpoints.

## Why use scripts?

A script is easier than remembering multiple commands because this app has several services running at the same time:
- PostgreSQL database
- Redis broker
- Celery worker
- FastAPI server

Each one must stay running in its own terminal, so a script makes the setup much more beginner-friendly.

## Manual setup

### Windows

```powershell
# 1. Create virtual environment
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 2. Start PostgreSQL
docker run --name tubeslice-db -e POSTGRES_USER=User -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# 3. Start Redis
docker run --name redis -p 6379:6379 -d redis

# 4. Start Celery
celery -A app.worker.celery_app worker -l info -P solo

# 5. Start FastAPI
uvicorn main:app --reload --port 8080
```

### macOS / Linux

```bash
# 1. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 2. Start PostgreSQL
docker run --name tubeslice-db -e POSTGRES_USER=User -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# 3. Start Redis
docker run --name redis -p 6379:6379 -d redis

# 4. Start Celery
celery -A app.worker.celery_app worker -l info -P solo

# 5. Start FastAPI
uvicorn main:app --reload --port 8080
```

## Project URLs

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Notes

- The database is configured in [app/config/database.py](app/config/database.py).
- FastAPI startup is handled in [main.py](main.py).
- Celery is configured in [app/worker.py](app/worker.py).
- The downloader uses yt-dlp in [app/adapter/youtube_download.py](app/adapter/youtube_download.py).
