import ast
import json
import logging
import unicodedata
from celery.signals import task_prerun
from django.contrib.auth.models import User
from django.db.transaction import atomic
from django.db.models.signals import post_save
from memtree.celery import app
from .models import Item
from task.models import Task

LOG = logging.getLogger('django')


def deserializer(data):
    """
    str to object
    """
    if isinstance(data, dict):
        return {k: deserializer(v) for k, v in data.items()}
    if isinstance(data, (list, tuple)):
        return [deserializer(i) for i in data]
    if isinstance(data, str):
        try:
            return deserializer(json.loads(data))
        except json.JSONDecodeError:
            pass
        try:
            return deserializer(ast.literal_eval(data))
        except (SyntaxError, AttributeError, TypeError, ValueError):
            pass
        return str_normalizer(data)
    return data


def str_normalizer(data: str) -> str:
    """
    Try to remove/convert useless escapes, unicode
    """
    original_data = data

    for _ in range(5):
        try:
            data = unicodedata.normalize("NFKD", data)
        except Exception:
            data = original_data

        try:
            data = data.encode('utf-8').decode('unicode_escape')
        except UnicodeDecodeError:
            pass

        try:
            data = data.encode('latin1').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass

        if data == original_data:
            break
        original_data = data

    return data


def prettier(data: str) -> str:
    """
    Trying to format formattable str
    """
    _data = deserializer(data)
    if isinstance(_data, (dict, list, tuple)):
        try:
            return json.dumps(
                _data,
                indent=4,
                ensure_ascii=False,
                sort_keys=True,
            )
        except (ValueError, TypeError):
            pass
    return str(_data)


@app.task(max_retries=0)
@atomic
def create(user_id, comment, text: str, parent_id):
    user = User.objects.get(pk=user_id)
    item_data = {'text': prettier(text), 'user': user}
    if parent_id:
        item_data['parent'] = Item.objects.get(pk=parent_id, user_id=user_id)
    item = Item.objects.create(**item_data)
    item.save()
    if item.parent:
        post_save.send(sender=Item, instance=item.parent, created=False)
    return item.uuid


@app.task
@atomic
def update(user_id, comment, item_id, **kwargs):
    item = Item.objects.get(pk=item_id, user_id=user_id)
    old_parent = None
    update_fields = []
    if 'text' in kwargs and item.text != kwargs['text']:
        item.text = prettier(kwargs['text'])
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
            post_save.send(sender=Item, instance=old_parent, created=False)
        if item.parent:
            post_save.send(sender=Item, instance=item.parent, created=False)
    return update_fields


@app.task
@atomic
def delete(user_id, comment, items_ids: list):
    items_to_delete = Item.objects.filter(pk__in=items_ids, user_id=user_id)
    parents_ids = list(items_to_delete.values_list('parent', flat=True).distinct())
    items_to_delete.delete()
    for parent_item in Item.objects.filter(pk__in=parents_ids, user_id=user_id):
        post_save.send(sender=Item, instance=parent_item, created=False)
    return 'OK'


@app.task(retry=False)
@atomic
def import_data(user_id, comment, data: list):
    user = User.objects.get(pk=user_id)
    def rec_create(_data: list, _parent=None):
        for item_data in _data:
            item_data['user'] = user
            if _parent:
                item_data['parent'] = _parent
            children = item_data.pop('children')
            item = Item.objects.create(**item_data)
            item.created = item_data['created']
            item.modified = item_data['modified']
            item.save()
            if children:
                rec_create(children, item)
        if _parent:
            post_save.send(sender=Item, instance=_parent, created=False)
    if data:
        rec_create(data)
    return 'OK'


@task_prerun.connect(sender=create)
@task_prerun.connect(sender=update)
@task_prerun.connect(sender=delete)
@task_prerun.connect(sender=import_data)
def create_task_in_db(*args, **kwargs):
    task_kwargs = kwargs['kwargs']
    user = User.objects.get(pk=task_kwargs['user_id'])
    Task.objects.create(id=kwargs['task_id'], name=task_kwargs['comment'], user=user)
