import os
from celery import Celery
from celery.schedules import timedelta


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memtree.settings')

app = Celery('memtree')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.beat_schedule = {
    'collect-results': {
        'task': 'task.tasks.collect_results',
        'schedule': timedelta(seconds=2),
    },
}
app.autodiscover_tasks()
