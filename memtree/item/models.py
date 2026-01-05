import logging
from uuid import uuid4
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

LOG = logging.getLogger('django')


class ItemManager(models.Manager):

    class Meta:
        abstract = True


class Item(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(default=timezone.now)
    text = models.TextField(null=True, blank=True)
    parent = models.ForeignKey('Item', related_name='children', null=True, blank=True, on_delete=models.CASCADE)
    collapsed = models.BooleanField(default=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')

    objects = ItemManager()

    def __str__(self):
        return self.uuid

    @property
    def uuid(self) -> str:
        return str(self.id)

    def save(self, *args, **kwargs):
        if not self._state.adding and Item.objects.get(pk=self.pk).text != self.text:
            self.modified = timezone.now()
            kwargs.get('update_fields', []).append('modified')
        super().save(*args, **kwargs)

    @property
    def path_list(self) -> list:
        if self.parent:
            return self.parent.path_list + [self.uuid]
        return [self.uuid]

    @property
    def path(self) -> str:
        return f'/ {" / ".join(self.path_list)}'

    @property
    def length(self) -> int:
        if self.text:
            return len(self.text)
        return 0

    @property
    def rows(self) -> int:
        if self.text:
            return len(self.text.split('\n'))
        return 1

    @property
    def cols(self) -> int:
        cols = 4
        if self.text:
            cols = 1
            for row in self.text.split('\n'):
                if len(row) > cols:
                    cols = len(row)
        return cols

    @property
    def alphabet(self) -> str:
        if self.text:
            return ''.join(sorted(list(set(self.text))))
        return ''

    @property
    def children_count(self) -> int:
        return self.children.count()
        # return len(self.__class__.descendants_ids(self.id))

    @property
    def descendants(self):
        """ Все потомки """
        children = list(self.children.all())
        descendants = []
        for child in children:
            descendants.extend(child.descendants)
        children.extend(descendants)
        return children

    @classmethod
    def descendants_ids(cls, item_id) -> list:
        """ ID всех потомков """
        children_ids = list(cls.objects.filter(parent=item_id).values_list('id', flat=True))
        descendants_ids = []
        for child_id in children_ids:
            descendants_ids.extend(cls.descendants_ids(item_id=child_id))
        children_ids.extend(descendants_ids)
        return children_ids
