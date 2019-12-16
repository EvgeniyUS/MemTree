# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from django.http import HttpResponse
import json

from gorynych.models import mainTreeDataBase


def gorynych(request):
    if request.method == "POST":
        if request.is_ajax():
            values = request.POST.dict()

            if values['type'] == "update":
                collapsed_value = True if values['collapsed'] == 'true' else False
                mainTreeDataBase.objects.filter(id=values['id']).update(collapsed=collapsed_value,
                                                                        name=values['name'])
                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")

            elif values['type'] == "create":
                name = None
                if values['parent']:
                    parent = mainTreeDataBase.objects.get(id=values['parent'])
                else:
                    parent = None
                new_item = mainTreeDataBase.objects.create(name=name, parent=parent)
                return HttpResponse(json.dumps({'id': new_item.id,
                                                'collapsed': new_item.collapsed,
                                                'name': name,
                                                'parent': parent.id if parent else None}),
                                    content_type="application/json")

            elif values['type'] == "delete":
                mainTreeDataBase.objects.filter(id=values['id']).delete()
                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")

    else:
        if request.GET.dict().get('type') and request.GET.dict()['type'] == 'all':
            items = list(mainTreeDataBase.objects.values('id', 'collapsed', 'name', 'parent'))
            # items = list(mainTreeDataBase.objects.all())
            return HttpResponse(json.dumps({'data': items}), content_type="application/json")
        else:
            objects = list(mainTreeDataBase.objects.values('id', 'collapsed', 'name', 'parent'))
            context = {'object_list': json.dumps(objects)}
            return render(request, 'gorynych/mainTable.html', context)
