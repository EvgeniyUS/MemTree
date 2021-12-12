# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
from django.shortcuts import render
from django.http import HttpResponse
from MemTree.models import Item


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
                    if values['parent'] and values['parent'] != 'false':
                        item.parent = Item.objects.get(id=values['parent'])
                    else:
                        item.parent = None
                    item.save()

                elif values['type'] == "delete":
                    item.delete()

                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")

    elif request.method == "GET":
        if request.is_ajax():
            return HttpResponse(json.dumps(Item.sorted_items()), content_type="application/json")
        else:
            return render(request, 'MemTree/MemTree.html')
