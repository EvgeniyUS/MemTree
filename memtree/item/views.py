from django.db.models.signals import post_save
from django_filters import rest_framework as filters
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from .models import Item
from .serializers import (
    ItemObjectSerializer, ItemTreeSerializer, ItemParentSerializer,
    ItemsIDsSerializer, ItemBulkMoveSerializer)
from .tasks import bulk_delete


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
        serializer.save()
        if serializer.validated_data['parent']:
            post_save.send(sender=Item,
                           instance=serializer.validated_data['parent'],
                           created=False)

    @action(methods=['delete'], detail=False, url_path="bulk-delete")
    def bulk_delete(self, request, *args, **kwargs):
        """ Removes specified items. """
        serializer = ItemsIDsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items_ids = list(self.filter_queryset(self.get_queryset()).filter(
            pk__in=serializer.validated_data['items_ids']).values_list('id', flat=True))
        bulk_delete.delay(items_ids)
        return Response('OK')

    @action(methods=['delete'], detail=True, url_path="delete-children")
    def delete_children(self, request, *args, **kwargs):
        """ Removes all children of the item. """
        item = self.get_object()
        item.children.all().delete()
        post_save.send(sender=Item, instance=item, created=False)
        return Response(f'All child elements of the element id={item.pk} have been deleted.')

    @action(methods=['put'], detail=False, url_path="bulk-move")
    def bulk_move(self, request, *args, **kwargs):
        """ Moves items to specified parent. """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ItemBulkMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for item in queryset.filter(pk__in=serializer.validated_data['items_ids']):
            old_parent = item.parent
            item_serializer = ItemObjectSerializer(
                data={'parent': serializer.validated_data['parent']},
                instance=item, context={'request': request})
            item_serializer.is_valid(raise_exception=True)
            item_serializer.save()
            if old_parent:
                post_save.send(sender=Item, instance=old_parent, created=False)
        if serializer.validated_data['parent']:
            parent = queryset.get(pk=serializer.validated_data['parent'])
            post_save.send(sender=Item, instance=parent, created=False)
        return Response(
            f"Elements ids={str(serializer.validated_data['items_ids'])} "
            f"have been moved to parent element id={serializer.validated_data['parent']}.")

    @action(methods=['put'], detail=True, url_path="move-children")
    def move_children(self, request, *args, **kwargs):
        """ Moves all children of the item to specified parent. """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ItemParentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.get_object()
        for child in item.children.all():
            child_serializer = ItemObjectSerializer(data=serializer.validated_data,
                                                    instance=child,
                                                    context={'request': request})
            child_serializer.is_valid(raise_exception=True)
            child_serializer.save()
        post_save.send(sender=Item, instance=item, created=False)
        if serializer.validated_data['parent']:
            parent = queryset.get(pk=serializer.validated_data['parent'])
            post_save.send(sender=Item, instance=parent, created=False)
        return Response(
            f'All child elements of the element id={item.pk} ' 
            f"have been moved to parent element id={serializer.validated_data['parent']}.")

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
