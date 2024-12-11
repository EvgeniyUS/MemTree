from django_filters import rest_framework as filters
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from .models import Item
from .serializers import ItemObjectSerializer, ItemBulkUpdateSerializer, ItemTreeSerializer


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
    ordering_fields = ('text', 'collapsed', 'parent')
    ordering = ('text',)
    search_fields = ['id', 'text']

    @action(methods=['patch'], detail=False, url_path="bulk-update")
    def bulk_update(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ItemBulkUpdateSerializer(instance=queryset, data=request.data,
                                              context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

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

    @action(methods=['get'], detail=True, url_path="test")
    def test(self, request, *args, **kwargs):
        return Response(self.get_object().path)
