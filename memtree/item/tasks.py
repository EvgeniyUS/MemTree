# import json
import logging
from celery.signals import task_prerun
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models.signals import post_save
from memtree.celery import app
from .models import Item
from task.models import Task

LOG = logging.getLogger('django')


# def pretty_json(text: str) -> str:
#     try:
#         return json.dumps(json.loads(text), indent=4)
#     except:
#         return text


@app.task
def create(user_id, comment, text: str, parent_id):
    user = User.objects.get(pk=user_id)
    item_data = {'text': text, 'user': user}
    if parent_id:
        item_data['parent'] = Item.objects.get(pk=parent_id, user_id=user_id)
    item = Item.objects.create(**item_data)
    item.save()
    if item.parent:
        transaction.on_commit(lambda: post_save.send(sender=Item, instance=item.parent, created=False))
    return item.uuid


@app.task
def update(user_id, comment, item_id, **kwargs):
    item = Item.objects.get(pk=item_id, user_id=user_id)
    old_parent = None
    update_fields = []
    if 'text' in kwargs and item.text != kwargs['text']:
        item.text = kwargs['text']
        update_fields.append('text')
    if 'collapsed' in kwargs and item.collapsed != kwargs['collapsed']:
        item.collapsed = kwargs['collapsed']
        update_fields.append('collapsed')
    if 'parent' in kwargs:
        new_parent = Item.objects.get(pk=kwargs['parent'], user_id=user_id) if kwargs['parent'] else None
        if item.parent != new_parent:
            old_parent = item.parent
            item.parent = new_parent
            update_fields.append('parent')
    item.save(update_fields=update_fields)
    if 'parent' in update_fields:
        if old_parent:
            transaction.on_commit(lambda: post_save.send(sender=Item, instance=old_parent, created=False))
        if item.parent:
            transaction.on_commit(lambda: post_save.send(sender=Item, instance=item.parent, created=False))
    return update_fields


@app.task
def delete(user_id, comment, items_ids: list):
    items_to_delete = Item.objects.filter(pk__in=items_ids, user_id=user_id)
    parents_ids = list(items_to_delete.values_list('parent', flat=True).distinct())
    items_to_delete.delete()
    for parent_item in Item.objects.filter(pk__in=parents_ids, user_id=user_id):
        transaction.on_commit(lambda: post_save.send(sender=Item, instance=parent_item, created=False))
    return 'OK'


@app.task
def import_data(user_id, comment, data: dict):
    LOG.info(data.keys())
    return 'OK'


@task_prerun.connect(sender=create)
@task_prerun.connect(sender=update)
@task_prerun.connect(sender=delete)
@task_prerun.connect(sender=import_data)
def create_task_in_db(*args, **kwargs):
    task_kwargs = kwargs['kwargs']
    user = User.objects.get(pk=task_kwargs['user_id'])
    Task.objects.create(id=kwargs['task_id'], name=task_kwargs['comment'], user=user)
