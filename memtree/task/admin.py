from django.contrib import admin
from .models import Task


class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'user',
        'created',
        'finished',
        'result',
        'status',
    )


admin.site.register(Task, TaskAdmin)
