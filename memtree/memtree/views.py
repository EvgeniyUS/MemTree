from django.shortcuts import render
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth import (
    authenticate,
    login as _login,
    logout as _logout
)
from django.views.decorators.http import require_GET, require_http_methods


@require_GET
@login_required
def index(request):
    try:
        return render(request, 'item/item.html')
    except Exception as e:
        return JsonResponse(data={'error': str(e)}, status=500,
                            content_type="application/json")


@require_GET
@login_required
def user_help(request):
    try:
        return render(request, 'memtree/user_help.html')
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
            return render(request, 'memtree/login.html',
                          {'form': AuthenticationForm(request),
                           'message': 'Invalid credentials'})
    else:
        return render(request, 'memtree/login.html', {'form': AuthenticationForm})


@require_http_methods(['GET', 'POST'])
@login_required
def logout(request):
    if request.method == "POST":
        _logout(request)
        return HttpResponseRedirect('/')
    return render(request, 'memtree/confirm.html', {'action': 'Log Out'})


@require_http_methods(['GET', 'POST'])
def registration(request):
    if request.method == 'POST':
        new_user_data = UserCreationForm(request.POST)
        if new_user_data.is_valid():
            new_user_data.save()
            return HttpResponseRedirect('/')
        else:
            return render(request, 'memtree/registration.html',
                          {'form': new_user_data})
    return render(request, 'memtree/registration.html', {'form': UserCreationForm})


@require_http_methods(['GET', 'POST'])
@login_required
def delete_account(request):
    if request.method == "POST":
        if not request.user.is_staff:
            request.user.delete()
            return HttpResponseRedirect('/')
    return render(request, 'memtree/confirm.html',
                  {'action': 'Remove Account with all items'})
