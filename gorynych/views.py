# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
import json

from gorynych.models import mainTreeDataBase

def gorynych(request):
    if request.is_ajax():
        context = {'object_list': json.dumps(['ok'])}
        return render(request, 'gorynych/mainTable.html', context)
    else:
        objects = list(mainTreeDataBase.objects.all().values())
        context = {'object_list': json.dumps(objects)}
        return render(request, 'gorynych/mainTable.html', context)
