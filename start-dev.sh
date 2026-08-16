#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop or Docker Engine first."
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
if [ -f "requirements.txt" ]; then
  python -m pip install -r requirements.txt
fi

if ! docker ps -a --format '{{.Names}}' | grep -q '^tubeslice-db$'; then
  echo "Starting PostgreSQL container..."
  docker run --name tubeslice-db -e POSTGRES_USER=User -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
else
  echo "PostgreSQL container already exists. Starting it..."
  docker start tubeslice-db >/dev/null
fi

if ! docker ps -a --format '{{.Names}}' | grep -q '^redis$'; then
  echo "Starting Redis container..."
  docker run --name redis -p 6379:6379 -d redis
else
  echo "Redis container already exists. Starting it..."
  docker start redis >/dev/null
fi

echo "Starting Celery worker in a new terminal..."
osascript -e 'tell app "Terminal" to do script "cd \"'$ROOT_DIR'\" && source .venv/bin/activate && celery -A app.worker.celery_app worker -l info -P solo"' >/dev/null 2>&1 || true

echo "Starting FastAPI app in a new terminal..."
osascript -e 'tell app "Terminal" to do script "cd \"'$ROOT_DIR'\" && source .venv/bin/activate && uvicorn main:app --reload --port 8080"' >/dev/null 2>&1 || true

echo ""
echo "TubeSlice is starting up..."
echo "API: http://localhost:8080"
echo "Swagger UI: http://localhost:8080/docs"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"
echo ""
echo "To stop the containers later:"
echo "  docker stop tubeslice-db redis"
