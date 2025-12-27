import logging
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

LOG = logging.getLogger('django')


class ItemManager(models.Manager):

    class Meta:
        abstract = True

    def sorted(self):
        sorted_items = list()

        def rec(_items):
            sorted_items.extend(_items.values(
                'id', 'collapsed', 'text', 'parent').order_by('text'))
            _children = self.filter(parent__in=_items.filter(collapsed=False))
            if _children:
                rec(_children)

        rec(self.filter(parent=None))
        return sorted_items


class Item(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(default=timezone.now)
    text = models.TextField(null=True, blank=True)
    parent = models.ForeignKey('Item', related_name='children', null=True, blank=True, on_delete=models.CASCADE)
    collapsed = models.BooleanField(default=True)
    user = models.ForeignKey(User, default=1, on_delete=models.CASCADE, related_name='items')

    objects = ItemManager()

    def __str__(self):
        return f'ID={self.uuid}. TEXT={self.text[:50] if self.text else None}.'

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
        return f'/{"/".join(self.path_list)}'

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

    @property
    def descendants(self):
        """ Все потомки """
        children = list(self.children.all())
        descendants = []
        for child in children:
            descendants.extend(child.descendants)
        children.extend(descendants)
        return children

    @property
    def descendants_ids(self):
        return [child.uuid for child in self.descendants]

    @staticmethod
    def tree_validation(user: User) -> bool:
        """ Проверка дерева пользователя на основе количества """
        items = user.items
        def rec(_items, _count):
            if _items:
                _count += _items.count()
                return rec(items.filter(parent__in=_items), _count)
            return _count
        _count = rec(items.filter(parent=None), 0)
        return items.count() == _count
