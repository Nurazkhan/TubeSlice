from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379', backend='redis://localhost:6379')

celery_app.autodiscover_tasks(["app"])

import app.tasks.downloadTask