import json
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from .models import Item


@require_GET
@login_required
def index(request):
    try:
        return render(request, 'item/item.html',
                      context={'data': json.dumps(Item.sorted_items(request.user.items))})
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
