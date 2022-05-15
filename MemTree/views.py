# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth import (
    authenticate,
    login as _login,
    logout as _logout
)
from MemTree.models import Item


@login_required
def index(request):
    if request.method == "POST":
        if request.is_ajax():
            values = request.POST.dict()

            if values['type'] == "create":
                if values['parent'] and values['parent'] != 'false':
                    parent = request.user.items.get(id=values['parent'])
                else:
                    parent = None
                new_item = Item.objects.create(parent=parent, user=request.user)
                return HttpResponse(json.dumps({'id': new_item.id,
                                                'collapsed': new_item.collapsed,
                                                'name': new_item.name,
                                                'parent': parent.id if parent else None}),
                                    content_type="application/json")

            else:
                item = request.user.items.get(id=values['id'])

                if values['type'] == "name":
                    item.name = values['name']
                    item.save()

                elif values['type'] == "collapse":
                    item.collapsed = True if values['collapsed'] == 'true' else False
                    item.save()

                elif values['type'] == "move":
                    if values['parent'] and values['parent'] != 'false':
                        item.parent = request.user.items.get(id=values['parent'])
                    else:
                        item.parent = None
                    item.save()

                elif values['type'] == "delete":
                    item.delete()

                return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")

    elif request.method == "GET":
        if request.is_ajax():
            return HttpResponse(json.dumps(Item.sorted_items(request.user.items)), content_type="application/json")
        else:
            return render(request, 'MemTree/MemTree.html')


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


@login_required
def logout(request):
    if request.method == "POST":
        _logout(request)
        return HttpResponseRedirect('/')
    return render(request, 'MemTree/confirm.html', {'action': 'Log Out'})


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


@login_required
def delete_account(request):
    if request.method == "POST":
        if not request.user.is_staff:
            request.user.delete()
            return HttpResponseRedirect('/')
    return render(request, 'MemTree/confirm.html', {'action': 'Remove Account with all items'})
