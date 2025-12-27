import os
from celery import Celery
from celery.schedules import timedelta, crontab


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memtree.settings')

app = Celery('memtree')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.beat_schedule = {
    'collect-results': {
        'task': 'task.tasks.collect_results',
        'schedule': timedelta(seconds=2),  # every 2 seconds
    },
    'cleanup-old-taskss': {
        'task': 'task.tasks.cleanup_old_tasks',
        'schedule': crontab(hour=21, minute=0),  # every day at 21:00 UTC
    },
}
app.autodiscover_tasks()
