from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379', backend='redis://localhost:6379',
                    include=['app.tasks.downloadTask'])

# celery_app.autodiscover_tasks(["app"])

# import app.tasks.downloadTask.download_process