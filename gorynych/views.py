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
                mainTreeDataBase.objects.filter(id = values['id']).update(name = values['name'])
                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
            elif values['type'] == "create":
                if values['parent']:
                    v = {'name': None, 'parent': mainTreeDataBase.objects.get(id=values['parent'])}
                    #return HttpResponse(json.dumps({'id': n.id, 'name': n.name, 'parent': n.parent.__dict__['id']}), content_type="application/json")
                else:
                    v = {'name': None, 'parent': None}
                n = mainTreeDataBase.objects.create(name=v['name'], parent=v['parent'])
                return HttpResponse(json.dumps({'id': n.id, 'name': v['name'], 'parent': values['parent']}), content_type="application/json")
            elif values['type'] == "delete":
                mainTreeDataBase.objects.filter(id=values['id']).delete()
                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
    else:
        objects = list(mainTreeDataBase.objects.values('id', 'name', 'parent'))
        context = {'object_list': json.dumps(objects)}
        return render(request, 'gorynych/mainTable.html', context)

#def updateName(request):
#    if request.is_ajax():
#        values = request.POST.dict()
#        mainTreeDataBase.objects.filter(id = values['id']).update(name = values['name'])
#        return render(request, 'gorynych/mainTable.html')

