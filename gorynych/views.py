# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
import json

from gorynych.models import mainTreeDataBase

def gorynych(request):
    objects = list(mainTreeDataBase.objects.all().values())
    context = {'object_list': json.dumps(objects)}
    return render(request, 'gorynych/mainTable.html', context)
