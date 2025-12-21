import logging
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from memtree.celery import app
from .models import Item

LOG = logging.getLogger('django')


@app.task
def create(text: str, parent_id, user_id):
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
def delete(items_ids: list):
    items_to_delete = Item.objects.filter(pk__in=items_ids)
    parents_ids = list(items_to_delete.values_list('parent', flat=True).distinct())
    items_to_delete.delete()
    for parent_item in Item.objects.filter(pk__in=parents_ids):
        post_save.send(sender=Item, instance=parent_item, created=False)
    return 'OK'


@app.task
def move(item_id: str, parent_id: str):
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
