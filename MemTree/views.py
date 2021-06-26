# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from django.http import HttpResponse
import json

from MemTree.models import Item


def all_items_sorted():
    items = Item.objects.values('id', 'collapsed', 'name', 'parent')
    sorted_items = list()

    def get_item(i_id):
        return [i for i in items if i['id'] == i_id][0]

    def rec(rec_item):
        sorted_ids = [i['id'] for i in sorted_items]
        if rec_item['parent'] and rec_item['parent'] not in sorted_ids:
            rec(get_item(rec_item['parent']))
        if rec_item['id'] not in sorted_ids:
            sorted_items.append(rec_item)

    for item in items:
        rec(item)

    return sorted_items


def index(request):
    if request.method == "POST":
        if request.is_ajax():
            values = request.POST.dict()

            if values['type'] == "create":
                if values['parent'] and values['parent'] != 'false':
                    parent = Item.objects.get(id=values['parent'])
                else:
                    parent = None
                new_item = Item.objects.create(parent=parent)
                return HttpResponse(json.dumps({'id': new_item.id,
                                                'collapsed': new_item.collapsed,
                                                'name': new_item.name,
                                                'parent': parent.id if parent else None}),
                                    content_type="application/json")

            else:
                item = Item.objects.get(id=values['id'])

                if values['type'] == "name":
                    item.name = values['name']
                    item.save()

                elif values['type'] == "collapse":
                    item.collapsed = True if values['collapsed'] == 'true' else False
                    item.save()

                elif values['type'] == "move":
                    if values['parent']:
                        item.parent = Item.objects.get(id=values['parent'])
                    else:
                        item.parent = None
                    item.save()

                elif values['type'] == "delete":
                    item.delete()

                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")

    elif request.method == "GET":
        if request.is_ajax():
            return HttpResponse(json.dumps({'all': all_items_sorted()}), content_type="application/json")
        else:
            return render(request, 'MemTree/MemTree.html')
