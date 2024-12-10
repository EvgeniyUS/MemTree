from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save


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
    text = models.TextField(null=True, blank=True)
    parent = models.ForeignKey('Item', related_name='children', null=True, blank=True, on_delete=models.CASCADE)
    collapsed = models.BooleanField(default=True)
    user = models.ForeignKey(User, default=1, on_delete=models.CASCADE, related_name='items')

    objects = ItemManager()

    def __str__(self):
        return str(self.id)

    def save(self, *args, **kwargs):
        old_parent = None
        if self.pk:
            old_parent = Item.objects.get(pk=self.pk).parent
        super().save(*args, **kwargs)
        if self.parent:
            post_save.send(sender=Item, instance=self.parent, created=False)
        if old_parent and old_parent != self.parent:
            post_save.send(sender=Item, instance=old_parent, created=False)

    def delete(self, *args, **kwargs):
        parent = self.parent
        super().delete(*args, **kwargs)
        if parent:
            post_save.send(sender=Item, instance=parent, created=False)

    @property
    def path_list(self) -> list:
        if self.parent:
            return self.parent.path_list + [str(self.id)]
        return [str(self.id)]

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
        cols = 1
        if self.text:
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
        return [child.id for child in self.descendants]

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

    @staticmethod
    def tree_update_validation(data: list) -> bool:
        for item_data in data:
            if 'parent' in item_data:
                if item := Item.objects.filter(pk=item_data['id']).first():
                    if item == item_data['parent']:
                        return False
                    if item_data['parent'] in item.descendants:
                        return False
        return True
