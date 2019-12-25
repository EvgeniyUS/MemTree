# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models


class Item(models.Model):
    collapsed = models.BooleanField(default=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    parent = models.ForeignKey('Item', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return ' - '.join([self.id, self.name])
