$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Host "Checking Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is required. Install Docker Desktop and restart the terminal."
}

if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..."
    py -m venv .venv
}

Write-Host "Activating virtual environment and installing dependencies..."
& ".\.venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
if (Test-Path "requirements.txt") {
    python -m pip install -r requirements.txt
}

Write-Host "Starting PostgreSQL container..."
$postgresExists = docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch "tubeslice-db"
if (-not $postgresExists) {
    docker run --name tubeslice-db -e POSTGRES_USER=User -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
} else {
    docker start tubeslice-db | Out-Null
}

Write-Host "Starting Redis container..."
$redisExists = docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch "redis"
if (-not $redisExists) {
    docker run --name redis -p 6379:6379 -d redis
} else {
    docker start redis | Out-Null
}

Write-Host "Starting Celery worker in a new terminal..."
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$repoRoot'; . '.\.venv\Scripts\Activate.ps1'; celery -A app.worker.celery_app worker -l info -P solo" -WorkingDirectory $repoRoot

Write-Host "Starting FastAPI app in a new terminal..."
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$repoRoot'; . '.\.venv\Scripts\Activate.ps1'; uvicorn main:app --reload --port 8080" -WorkingDirectory $repoRoot

Write-Host ""
Write-Host "TubeSlice is starting up..."
Write-Host "API: http://localhost:8080"
Write-Host "Postgres: localhost:5432"
Write-Host "Redis: localhost:6379"
Write-Host "Celery worker: started in a separate terminal"
Write-Host ""
Write-Host "To stop the containers later:"
Write-Host "  docker stop tubeslice-db redis"
