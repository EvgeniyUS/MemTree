import logging
from django.contrib.auth.models import User
from django.db.models import Q
from celery import shared_task
from celery.app.control import Inspect
from celery.result import AsyncResult
from memtree.celery import app
from .models import Task, TaskStatus

LOG = logging.getLogger('django')


def is_task_in_queue(task_uuid):
    try:
        for _, task_data in Inspect(app=app).query_task([task_uuid]).items():
            if task_data:
                return True
    except Exception as e:
        LOG.info(e)
    return False


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
                task.set_done(result.result, result.date_done)
            elif result.failed():
                task.set_failed(result.result, result.date_done)
        else:
            if is_task_in_queue(task.uuid):
                task.set_in_progress()
            else:
                task.set_failed('LOST')


@shared_task(ignore_result=True)
def cleanup_old_tasks(max_per_user=100):
    try:
        user_ids = Task.objects.values_list('user_id', flat=True).distinct()

        for user_id in user_ids:
            user_tasks = Task.objects.filter(
                user_id=user_id,
                status__in=[TaskStatus.DONE, TaskStatus.FAILED]
            ).order_by('finished').values_list('id', flat=True)

            count_to_delete = len(user_tasks) - max_per_user
            if count_to_delete <= 0:
                continue

            Task.objects.filter(id__in=user_tasks[:count_to_delete]).delete()
    except Exception as e:
        LOG.error(e)
