
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from item.serializers import ItemObjectSerializer


@receiver([post_save, post_delete], sender=ItemObjectSerializer.Meta.model)
def signals_receiver(sender, **kwargs):
    if instance := kwargs.get('instance'):
        data = ItemObjectSerializer(instance=instance).data
        created = kwargs.get("created")
        if created is None:
            data['signal'] = 'deleted'
        elif created:
            data['signal'] = 'created'
        else:
            data['signal'] = 'updated'
        async_to_sync(get_channel_layer().group_send)(
            f'{instance.user.username}.{instance.user.id}',
            {'type': 'notify', 'data': data}
        )
