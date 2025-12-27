import logging
from uuid import uuid4
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

LOG = logging.getLogger('django')


class TaskStatus:
    PADDING = 'padding'
    IN_PROGRESS = 'in_progress'
    DONE = 'done'
    FAILED = 'failed'


class TaskManager(models.Manager):

    class Meta:
        abstract = True


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    status = models.CharField(default=TaskStatus.PADDING, max_length=15)
    name = models.CharField(null=True, blank=True, max_length=255)
    result = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    finished = models.DateTimeField(null=True, blank=True)
    user = models.ForeignKey(User, related_name='tasks', on_delete=models.CASCADE)

    objects = TaskManager()

    def __str__(self):
        return f'ID={self.uuid}. STATUS={self.status}. NAME={self.name}. RESULT={str(self.result)}'

    @property
    def uuid(self) -> str:
        return str(self.id)

    def set_in_progress(self):
        if self.status != TaskStatus.IN_PROGRESS:
            self.status = TaskStatus.IN_PROGRESS
            self.save(update_fields=['status'])
            LOG.info(f'Task {self.uuid} in progress.')

    def set_done(self, result, date_done):
        self.status = TaskStatus.DONE
        self.result = str(result)
        self.finished = date_done
        self.save(update_fields=['status', 'result', 'finished'])
        LOG.info(f'Task {self.uuid} is DONE. Result: {str(result)}')

    def set_failed(self, result, date_done=timezone.now()):
        self.status = TaskStatus.FAILED
        self.result = str(result)
        self.finished = date_done
        self.save(update_fields=['status', 'result', 'finished'])
        LOG.warning(f'Task {self.uuid} is FAILED. Error: {str(result)}')
