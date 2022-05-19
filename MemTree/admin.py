# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.contrib import admin
from MemTree.models import Item

class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'collapsed', 'user')


admin.site.register(Item, ItemAdmin)
