# TubeSlice Backend

TubeSlice is a FastAPI backend for reading YouTube video metadata, creating video slice jobs, and downloading finished MP4 segments. Long running downloads are handled by Celery workers with Redis.

## Stack

- FastAPI
- Celery
- Redis
- SQLAlchemy with SQLite
- yt-dlp
- ffmpeg
- JWT authentication

## Local Setup

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start Redis on port `6379`, then run the worker:

```bash
celery -A app.worker.celery_app worker -l info -P solo
```

Start the API:

```bash
uvicorn main:app --reload --port 8080
```

## Authentication

Protected routes expect a bearer token:

```http
Authorization: Bearer <token>
```

## Main Flow

1. The frontend calls `POST /info` with a YouTube URL.
2. The backend returns title, duration, uploader, thumbnail, and available formats.
3. The frontend calls `POST /slice` with a URL, optional quality or format id, and optional time segments.
4. The backend creates a task and sends work to Celery.
5. The frontend polls `GET /status/{task_id}` or `GET /segment/{segment_id}`.
6. When the segment is downloaded, the frontend uses `GET /download/{segment_id}` to play or download the MP4.

## Endpoints

### `GET /`

Health check.

Response:

```json
{
  "message": "hello world! \n it is Tube Slice!"
}
```

### `GET /dashboard`

Requires authentication. Returns the authenticated dashboard response.

### `POST /signup`

Creates a user account.

Request:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:

```json
{
  "id": "user-uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "role": "user"
}
```

### `POST /login`

Returns a JWT token.

Request:

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:

```json
{
  "token": "jwt-token"
}
```

### `POST /info`

Reads video metadata without downloading the video.

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Response:

```json
{
  "title": "Video title",
  "duration": 212,
  "uploader": "Channel name",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "formats": [
    {
      "format_id": "18",
      "ext": "mp4",
      "resolution": "640x360",
      "note": "360p"
    }
  ]
}
```

### `POST /slice`

Creates a download job. If `segments` is missing, the backend downloads the full video.

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "720p",
  "format_id": "136",
  "segments": [
    {
      "start_time": 10,
      "end_time": 45
    }
  ]
}
```

`format_id` selects an exact yt-dlp format. If both `format_id` and `quality` are sent, `format_id` is used for the download.

Response:

```json
{
  "id": "task-uuid",
  "title": "Video title",
  "duration": 212,
  "uploader": "Channel name",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "status": "Accepted",
  "createdAt": 1723300000.0,
  "user_id": null,
  "segments": [
    {
      "id": "segment-uuid",
      "download_id": "task-uuid",
      "start_time": 10,
      "end_time": 45,
      "status": "Accepted",
      "format": "136",
      "createdAt": 1723300000.0
    }
  ]
}
```

### `GET /status/{task_id}`

Returns task status and segment data.

### `GET /segment/{segment_id}`

Returns segment status while processing. If the segment is downloaded, streams the MP4 file.

### `GET /download/{segment_id}`

Streams the downloaded MP4 file.

### `GET /all_downloads`

Returns every download task.

### `GET /my-downloads`

Requires authentication. Returns tasks created by the logged-in user.

### `POST /cookies`

Requires authentication. Uploads a `cookies.txt` file used by yt-dlp.

Form field:

- `file`: a file named `cookies.txt`

The file is saved as:

```text
app/cookies.txt
```

Response:

```json
{
  "message": "Cookies file updated successfully",
  "file_size": 1234,
  "path": "app/cookies.txt",
  "updated_by": "john@example.com"
}
```

### `DELETE /cookies`

Requires authentication. Deletes the uploaded `cookies.txt` file.

Response:

```json
{
  "message": "Cookies file deleted successfully",
  "deleted_by": "john@example.com"
}
```

## Download Status Values

- `Accepted`
- `Processing`
- `Downloaded`
- `Failed`
