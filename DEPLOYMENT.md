# Deployment Guide: TubeSlice Backend on VPS

## Prerequisites

- VPS with Linux (Ubuntu 20.04+ recommended)
- SSH access to VPS
- Public IP: 
- Domain (optional but recommended)

## Step 1: SSH into VPS

```bash
ssh root@IP
# or ssh user@IP if you use a non-root user
# You'll be prompted for your password or to use SSH key
```

## Step 2: Install System Dependencies

```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 (Option A: Using deadsnakes manual repo)
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys F23C5A6CF475977595C89F51BA6932366A755776
sudo sh -c 'echo "deb https://ppa.launchpadcontent.net/deadsnakes/ppa/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/deadsnakes.list'
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-distutils python3-pip
python3.11 --version

# OR (Option B: If Python 3.11 is not available, use Python 3.10)
# sudo apt install -y python3-venv python3-pip python3-dev
# python3 --version

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install FFmpeg
sudo apt install -y ffmpeg

# Install Git
sudo apt install -y git

# Optional: Install Nginx for reverse proxy
sudo apt install -y nginx
```

**Note:** If Python 3.11 installation fails, use Python 3.10 instead. Simply replace `python3.11` with `python3` in Step 4.

## Step 3: Clone Repository

```bash
cd /opt  # or any directory you prefer
sudo git clone https://github.com/YOUR_USERNAME/TubesliceBackend.git
cd TubesliceBackend/backend
sudo chown -R $USER:$USER /opt/TubesliceBackend  # Set permissions
```

## Step 4: Set Up Python Environment

```bash
cd /opt/TubesliceBackend/backend

# Create virtual environment
python3.11 -m venv .venv

# Activate venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

## Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following:
```
DATABASE_URL=postgresql://tubeslice_user:tubeslice_password@localhost/tubeslice
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-very-secure-random-key-here-change-this
ALLOWED_HOSTS=IP,your-domain.com
```

Save with **Ctrl+O**, then **Enter**, then **Ctrl+X**.

## Step 6: Start Docker Services

```bash
# Start PostgreSQL
sudo docker run --name tubeslice-db \
  -e POSTGRES_USER=tubeslice_user \
  -e POSTGRES_PASSWORD=tubeslice_password \
  -e POSTGRES_DB=tubeslice \
  -p 5432:5432 \
  -d postgres

# Start Redis
sudo docker run --name redis -p 6379:6379 -d redis
```

## Step 7: Initialize Database

```bash
# Make sure venv is activated
source .venv/bin/activate

# Run database initialization
python -c "from app.util.init_db import init_db; init_db()"
```

## Step 8: Run Backend Services with Systemd (Recommended)

### Create Celery Worker Service

```bash
sudo nano /etc/systemd/system/tubeslice-celery.service
```

Paste:
```ini
[Unit]
Description=TubeSlice Celery Worker
After=network.target redis-server.service

[Service]
Type=forking
User=ubuntu
WorkingDirectory=/opt/TubesliceBackend/backend
Environment="PATH=/opt/TubesliceBackend/backend/.venv/bin"
ExecStart=/opt/TubesliceBackend/backend/.venv/bin/celery -A app.worker.celery_app worker -l info --loglevel=info --logfile=/var/log/tubeslice-celery.log --pidfile=/var/run/celery.pid

[Install]
WantedBy=multi-user.target
```

### Create FastAPI Service

```bash
sudo nano /etc/systemd/system/tubeslice-api.service
```

Paste:
```ini
[Unit]
Description=TubeSlice FastAPI
After=network.target postgres.service redis-server.service

[Service]
Type=notify
User=ubuntu
WorkingDirectory=/opt/TubesliceBackend/backend
Environment="PATH=/opt/TubesliceBackend/backend/.venv/bin"
ExecStart=/opt/TubesliceBackend/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services to auto-start on reboot
sudo systemctl enable tubeslice-celery
sudo systemctl enable tubeslice-api

# Start services now
sudo systemctl start tubeslice-celery
sudo systemctl start tubeslice-api

# Check status
sudo systemctl status tubeslice-api
sudo systemctl status tubeslice-celery
```

## Step 9: Configure Nginx Reverse Proxy (Optional but Recommended)

```bash
sudo nano /etc/nginx/sites-available/tubeslice
```

Paste:
```nginx
upstream tubeslice {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name IP;

    client_max_body_size 100M;

    location / {
        proxy_pass http://tubeslice;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/tubeslice /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

Now your API is accessible at: `IP`

## Step 10: Configure Frontend (Vercel)

In your Vercel frontend project, update the API URL in [tubeslice_front/lib/api.ts](tubeslice_front/lib/api.ts):

```typescript
const API_URL = 'IP';  // Or use your domain when ready
```

Redeploy on Vercel after updating.

## Cookies Management Endpoint

TubeSlice now includes authenticated endpoints for managing YouTube cookies:

### Upload Cookies (POST /cookies)
```bash
# Upload a Netscape format cookies.txt file
curl -X POST http://IP/cookies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@cookies.txt"
```

**Response:**
```json
{
  "message": "Cookies file updated successfully",
  "file_size": 2048,
  "path": "app/cookies.txt",
  "updated_by": "user@example.com"
}
```

### Delete Cookies (DELETE /cookies)
```bash
curl -X DELETE http://IP/cookies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Requirements:**
- Must be authenticated (JWT token required)
- File must be named `cookies.txt`
- Max file size: 1MB
- Text/plain format (Netscape cookies format)

**Usage:**
- Cookies help bypass YouTube age restrictions and geo-blocking
- Recommended for improved YouTube extraction reliability
- Cookies are stored server-side and used automatically by yt-dlp

## Step 11: SSL Certificate (Highly Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain or public IP)
sudo certbot certonly --standalone -d your-domain.com

# Update Nginx to use SSL
sudo nano /etc/nginx/sites-available/tubeslice
```

Update to redirect HTTP → HTTPS and serve on 443.

## Monitoring & Maintenance

### View Logs
```bash
# FastAPI logs
sudo journalctl -u tubeslice-api -f

# Celery logs
sudo tail -f /var/log/tubeslice-celery.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart tubeslice-api
sudo systemctl restart tubeslice-celery
sudo systemctl restart nginx
```

### Update Backend Code
```bash
cd /opt/TubesliceBackend/backend
git pull origin main
source .venv/bin/activate
pip install -r requirements.txt  # if dependencies changed
sudo systemctl restart tubeslice-api
```

## Testing Deployment

Once running, test the API:

```bash
# Get video info
curl -X POST http://IP/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# View Swagger docs
# Visit: http://IP/docs
```

## Summary

- **Backend API**: http://IP
- **Swagger UI**: http://IP/docs
- **Frontend**: Deployed on Vercel, calls backend at http://IP
- **Services**: FastAPI + Celery running via systemd
- **Database**: PostgreSQL in Docker on port 5432
- **Cache**: Redis in Docker on port 6379

Your TubeSlice app is now live!
