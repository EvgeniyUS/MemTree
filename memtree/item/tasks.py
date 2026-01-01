# import json
import logging
from celery.signals import task_prerun
from django.contrib.auth.models import User
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
        item_data['parent'] = Item.objects.get(pk=parent_id)
    item = Item.objects.create(**item_data)
    item.save()
    if item.parent:
        post_save.send(sender=Item, instance=item.parent, created=False)
    return 'OK'


@app.task
def update(user_id, comment, item_id, text: str, collapsed: bool, parent_id):
    item = Item.objects.get(pk=item_id)
    update_fields = []
    if text is not None and item.text != text:
        item.text = text
        update_fields.append('text')
    if collapsed is not None and item.collapsed != collapsed:
        item.collapsed = collapsed
        update_fields.append('collapsed')
    if parent_id is not None and item.parent.uuid != parent_id:
        item.parent = Item.objects.get(pk=parent_id)
        update_fields.append('parent')
    item.save(update_fields=update_fields)
    if item.parent:
        post_save.send(sender=Item, instance=item.parent, created=False)
    return 'OK'


@app.task
def delete(user_id, comment, items_ids: list):
    items_to_delete = Item.objects.filter(pk__in=items_ids)
    parents_ids = list(items_to_delete.values_list('parent', flat=True).distinct())
    items_to_delete.delete()
    for parent_item in Item.objects.filter(pk__in=parents_ids):
        post_save.send(sender=Item, instance=parent_item, created=False)
    return 'OK'


@app.task
def move(user_id, comment, item_id: str, parent_id: str):
    item = Item.objects.get(pk=item_id)
    old_parent = item.parent
    if parent := Item.objects.filter(pk=parent_id).first():
        item.parent = parent
    else:
        item.parent = None
    item.save(update_fields=['parent'])
    if old_parent:
        post_save.send(sender=Item, instance=old_parent, created=False)
    if parent:
        post_save.send(sender=Item, instance=parent, created=False)
    return 'OK'


@task_prerun.connect(sender=create)
@task_prerun.connect(sender=update)
@task_prerun.connect(sender=move)
@task_prerun.connect(sender=delete)
def create_task_in_db(*args, **kwargs):
    task_kwargs = kwargs['kwargs']
    user = User.objects.get(pk=task_kwargs['user_id'])
    Task.objects.create(id=kwargs['task_id'], name=task_kwargs['comment'], user=user)
