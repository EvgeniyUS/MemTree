# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render

def home(request):
  return render(request, 'main/homePage.html')

def info(request):
  return render(request, 'main/info.html', {'values':['л/с: 0660096']})
