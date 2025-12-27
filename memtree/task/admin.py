from django.contrib import admin
from .models import Task


class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'finished',
        'name',
        'status',
        'user',
        'id',
        'created',
        'result',
    )


admin.site.register(Task, TaskAdmin)
