from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class Consumer(JsonWebsocketConsumer):

    def connect(self):
        self.accept()
        if not isinstance(self.scope['user'], AnonymousUser):
            group_name = f"{self.scope['user'].username}.{self.scope['user'].id}"
            async_to_sync(self.channel_layer.group_add)(group_name, self.channel_name)
        else:
            self.send_json(content={'error': '401 Unauthorized'}, close=True)

    def receive_json(self, content, **kwargs):
        pass
        # print(content)

    def notify(self, event: dict):
        self.send_json(event['data'])
