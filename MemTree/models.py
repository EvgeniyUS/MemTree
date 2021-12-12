# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models


class Item(models.Model):
    collapsed = models.BooleanField(default=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    parent = models.ForeignKey('Item', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return ' - '.join([self.id, self.name])

    @classmethod
    def sorted_items(cls):
        sorted_items = list()
        def rec(_items):
            sorted_items.extend(_items.values('id', 'collapsed', 'name', 'parent'))
            _children = cls.objects.filter(parent__in=_items)
            if _children:
                rec(_children)
        rec(cls.objects.filter(parent=None))
        return sorted_items
