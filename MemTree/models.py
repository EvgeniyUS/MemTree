# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User


class Item(models.Model):
    collapsed = models.BooleanField(default=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    parent = models.ForeignKey('Item', on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, default=1, on_delete=models.CASCADE, related_name='items')

    def __str__(self):
        return ' - '.join([self.id, self.name])

    @staticmethod
    def sorted_items(items):
        sorted_items = list()
        def rec(_items):
            sorted_items.extend(_items.values('id', 'collapsed', 'name', 'parent').order_by('name'))
            _children = items.filter(parent__in=_items)
            if _children:
                rec(_children)
        rec(items.filter(parent=None))
        return sorted_items
