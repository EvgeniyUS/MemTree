from django.contrib import admin
from .models import Item


class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'parent', 'collapsed', 'user')


admin.site.register(Item, ItemAdmin)
