import logging
from django.db.models import Q
from celery import shared_task
from celery.result import AsyncResult
from memtree.celery import app
from .models import Task, TaskStatus

LOG = logging.getLogger('django')


@shared_task(
    ignore_result=True,
    max_concurrency=1,
)
def collect_results():
    unfinished_tasks = Task.objects.filter(~Q(status__in=[TaskStatus.DONE, TaskStatus.FAILED]))
    
    for task in unfinished_tasks:
        result = AsyncResult(task.uuid, app=app)
        
        if result.ready():
            if result.successful():
                task.set_done(result.result)
            elif result.failed():
                task.set_failed(result.result)
        else:
            task.set_in_progress()
