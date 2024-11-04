from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class Item(models.Model):
    text = models.TextField(null=True, blank=True)
    parent = models.ForeignKey('Item', on_delete=models.CASCADE, null=True, blank=True)
    collapsed = models.BooleanField(default=True)
    user = models.ForeignKey(User, default=1, on_delete=models.CASCADE, related_name='items')

    def __str__(self):
        return str(self.id)

    @staticmethod
    def sorted_items(items):
        sorted_items = list()

        def rec(_items):
            sorted_items.extend(_items.values(
                'id', 'collapsed', 'text', 'parent').order_by('text'))
            _children = items.filter(parent__in=_items)
            if _children:
                rec(_children)

        rec(items.filter(parent=None))
        return sorted_items


@receiver([post_save, post_delete], sender=Item)
def signal_handler(sender, **kwargs):
    created = kwargs.get("created")
    if instance := kwargs.get('instance'):
        data = {'id': instance.id}
        if created is None:
            data.update({
                'signal': 'deleted'
            })
        elif created:
            data.update({
                'text': instance.text,
                'collapsed': instance.collapsed,
                'parent': instance.parent_id,
                'signal': 'created'
            })
        else:
            data['signal'] = 'updated'
            data.update({k: getattr(instance, k) for k in kwargs.get("update_fields") if hasattr(instance, k)})
            if parent := data.get('parent'):
                data['parent'] = parent.id
        async_to_sync(get_channel_layer().group_send)(
            f'{instance.user.username}.{instance.user.id}',
            {'type': 'notify', 'data': data}
        )
