import logging
from django.db.models.signals import post_save
from django_filters import rest_framework as filters
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from .models import Item
from .serializers import (
    ItemObjectSerializer, ItemTreeSerializer, ItemParentSerializer,
    ItemsIDsSerializer, ItemBulkMoveSerializer)
from .tasks import create, delete, move
from task.models import Task

LOG = logging.getLogger('django')


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class OwnerFilterBackend:
    @staticmethod
    def filter_queryset(request, queryset, view):
        return queryset.filter(user=request.user)


class ItemFilter(filters.FilterSet):
    text = filters.CharFilter(field_name="text", lookup_expr='icontains')
    parent = filters.CharFilter(method='filter_parent')

    @staticmethod
    def filter_parent(queryset, name, value):
        try:
            value = int(value)
        except ValueError:
            value = None
        return queryset.filter(parent=value)


class ItemViewSet(ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemObjectSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = (filters.DjangoFilterBackend, OwnerFilterBackend, OrderingFilter, SearchFilter)
    filterset_class = ItemFilter
    filterset_fields = ('text', 'parent')
    ordering_fields = ('created', 'modified', 'text', 'collapsed', 'parent')
    ordering = ('text',)
    search_fields = ['id', 'created', 'modified', 'text']
    http_method_names = ['get', 'post', 'put', 'delete']

    def perform_create(self, serializer):
        task = Task.objects.create_task(
            serializer.context['request'].user,
            f"Create item {serializer.validated_data['text']}.",
            create,
            serializer.validated_data['text'],
            serializer.validated_data['parent'].id,
            serializer.context['request'].user.id,
        )
        return Response(f'Task {task.uuid} created.')

    @action(methods=['delete'], detail=False, url_path="bulk-delete")
    def bulk_delete(self, request, *args, **kwargs):
        """ Removes specified items. """
        serializer = ItemsIDsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items_ids = list(self.filter_queryset(self.get_queryset()).filter(
            pk__in=serializer.validated_data['items_ids']).values_list('id', flat=True))
        if items_ids:
            task = Task.objects.create_task(
                request.user,
                f"Delete items {items_ids}.",
                delete,
                items_ids
            )
            return Response(f'Task {task.uuid} created.')
        return Response('OK', status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=True, url_path="delete-children")
    def delete_children(self, request, *args, **kwargs):
        """ Removes all children of the item. """
        item = self.get_object()
        children_items_ids = list(item.children.all().values_list('id', flat=True))
        if children_items_ids:
            task = Task.objects.create_task(
                request.user,
                f"Delete child items {children_items_ids} of item {item.pk}.",
                delete,
                children_items_ids
            )
            return Response(f'Task {task.uuid} created.')
        return Response('OK', status=status.HTTP_200_OK)

    @action(methods=['put'], detail=False, url_path="bulk-move")
    def bulk_move(self, request, *args, **kwargs):
        """ Moves items to specified parent. """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ItemBulkMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tasks_ids = []
        for item in queryset.filter(pk__in=serializer.validated_data['items_ids']):
            ItemObjectSerializer(
                data={'parent': serializer.validated_data['parent']},
                instance=item, context={'request': request}).is_valid(raise_exception=True)

            task = Task.objects.create_task(
                request.user,
                f"Move item {item.id} to {serializer.validated_data['parent'] or 'top'}.",
                move,
                item.id,
                serializer.validated_data['parent'],
            )
            tasks_ids.append(task.uuid)
        return Response(f'Tasks {tasks_ids} created.')

    @action(methods=['put'], detail=True, url_path="move-children")
    def move_children(self, request, *args, **kwargs):
        """ Moves all children of the item to specified parent. """
        serializer = ItemParentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.get_object()
        tasks_ids = []
        for child in item.children.all():
            ItemObjectSerializer(
                data=serializer.validated_data,
                instance=child,
                context={'request': request}
            ).is_valid(raise_exception=True)
            task = Task.objects.create_task(
                request.user,
                f"Move child item {child.id} of item {item.id} to {serializer.validated_data['parent'] or 'top'}.",
                move,
                child.id,
                serializer.validated_data['parent'],
            )
            tasks_ids.append(task.uuid)
        return Response(f'Tasks {tasks_ids} created.')

    @action(methods=['get'], detail=False, url_path="validate")
    def validate(self, request, *args, **kwargs):
        return Response(Item.tree_validation(request.user))

    @action(methods=['get'], detail=False, url_path="sorted")
    def sorted(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        sorted_items = list()

        def rec(_items):
            sorted_items.extend(ItemObjectSerializer(instance=_items, many=True).data)
            _children = queryset.filter(parent__in=_items.filter(collapsed=False)).order_by('text')
            if _children:
                rec(_children)

        rec(queryset.filter(parent=None))
        return Response(sorted_items)

    @action(methods=['get'], detail=False, url_path="full-tree")
    def full_tree(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        return Response(ItemTreeSerializer(instance=queryset.filter(parent=None), many=True).data)

    @action(methods=['get'], detail=True, url_path="tree")
    def tree(self, request, *args, **kwargs):
        return Response(ItemTreeSerializer(instance=self.get_object()).data)
