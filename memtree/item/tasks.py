from celery import chain
from django.db.models.signals import post_save
from memtree.celery import app
from .models import Item


@app.task
def bulk_delete(items_ids):
    chain = delete.s(items_ids) | send_signals.s()
    chain()
    return f'Items {items_ids} deleted.'


@app.task
def delete(items_ids: list):
    items_to_delete = Item.objects.filter(pk__in=items_ids)
    parents_ids = list(items_to_delete.values_list('parent', flat=True).distinct())
    items_to_delete.delete()
    return parents_ids


@app.task
def send_signals(parents_ids):
    for item in Item.objects.filter(pk__in=parents_ids):
        post_save.send(sender=Item, instance=item, created=False)
