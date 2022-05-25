# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
from django.shortcuts import render
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth import (
    authenticate,
    login as _login,
    logout as _logout
)
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from MemTree.models import Item


@require_GET
@login_required
def index(request):
    try:
        return render(request, 'MemTree/index.html')
    except Exception as e:
        return JsonResponse(data={'error': str(e)}, status=500,
                            content_type="application/json")


@require_GET
@login_required
def user_help(request):
    try:
        return render(request, 'MemTree/user_help.html')
    except Exception as e:
        return JsonResponse(data={'error': str(e)}, status=500,
                            content_type="application/json")


@require_GET
@login_required
def items(request):
    try:
        return JsonResponse(data=Item.sorted_items(request.user.items),
                            safe=False,
                            content_type="application/json")
    except Exception as e:
        return JsonResponse(data={'error': str(e)}, status=500,
                            content_type="application/json")


@require_POST
@login_required
def create(request):
    try:
        values = request.POST.dict()
        if values['parent'] and values['parent'] != 'false':
            parent = request.user.items.get(id=values['parent'])
        else:
            parent = None
        new_item = Item.objects.create(parent=parent, user=request.user)
        return JsonResponse(data={'id': new_item.id,
                                  'collapsed': new_item.collapsed,
                                  'text': new_item.text,
                                  'parent': parent.id if parent else None},
                            status=201,
                            content_type="application/json")
    except Exception as e:
        return JsonResponse(data={'error': str(e)}, status=500,
                            content_type="application/json")


@require_POST
@login_required
def collapse(request):
    try:
        values = request.POST.dict()
        item = request.user.items.get(id=values['id'])
        item.collapsed = True if values['collapsed'] == 'true' else False
        item.save(update_fields=['collapsed'])
        return JsonResponse(data={'result': 'OK'}, status=202,
                            content_type="application/json")
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500,
                            content_type="application/json")


@require_POST
@login_required
def change_text(request):
    try:
        values = request.POST.dict()
        item = request.user.items.get(id=values['id'])
        item.text = values['text']
        item.save(update_fields=['text'])
        return JsonResponse(data={'result': 'OK'}, status=202,
                            content_type="application/json")
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500,
                            content_type="application/json")


@require_POST
@login_required
def move(request):
    try:
        values = request.POST.dict()
        for item in request.user.items.filter(id__in=json.loads(values['ids'])):
            if values['parent'] and values['parent'] != 'false':
                item.parent = request.user.items.get(id=values['parent'])
            else:
                item.parent = None
            item.save(update_fields=['parent'])
        return JsonResponse(data={'result': 'OK'}, status=202,
                            content_type="application/json")
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500,
                            content_type="application/json")


@require_POST
@login_required
def delete(request):
    try:
        values = request.POST.dict()
        request.user.items.filter(id__in=json.loads(values['ids'])).delete()
        return JsonResponse(data={'result': 'OK'}, status=202,
                            content_type="application/json")
    except Exception as e:
        return JsonResponse(data={'error': str(e)}, status=500,
                            content_type="application/json")


@require_http_methods(['GET', 'POST'])
def login(request):
    if request.method == "POST":
        username = request.POST.get('username', '')
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            _login(request, user)
            return HttpResponseRedirect('/')
        else:
            return render(request, 'MemTree/login.html',
                          {'form': AuthenticationForm(request),
                           'message': 'Invalid credentials'})
    else:
        return render(request, 'MemTree/login.html', {'form': AuthenticationForm})


@require_http_methods(['GET', 'POST'])
@login_required
def logout(request):
    if request.method == "POST":
        _logout(request)
        return HttpResponseRedirect('/')
    return render(request, 'MemTree/confirm.html', {'action': 'Log Out'})


@require_http_methods(['GET', 'POST'])
def registration(request):
    if request.method == 'POST':
        new_user_data = UserCreationForm(request.POST)
        if new_user_data.is_valid():
            new_user_data.save()
            return HttpResponseRedirect('/')
        else:
            return render(request, 'MemTree/registration.html',
                          {'form': new_user_data})
    return render(request, 'MemTree/registration.html', {'form': UserCreationForm})


@require_http_methods(['GET', 'POST'])
@login_required
def delete_account(request):
    if request.method == "POST":
        if not request.user.is_staff:
            request.user.delete()
            return HttpResponseRedirect('/')
    return render(request, 'MemTree/confirm.html',
                  {'action': 'Remove Account with all items'})
