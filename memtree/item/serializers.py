from rest_framework import serializers
from rest_framework.exceptions import ValidationError, PermissionDenied
from item.models import Item


class ItemObjectSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, trim_whitespace=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Item
        read_only_fields = ['id', 'created', 'modified', 'user',
                            'children_count', 'path', 'path_list',
                            'length', 'rows', 'cols', 'alphabet']
        fields = read_only_fields + ['parent', 'collapsed', 'text']

    def validate(self, item_data):
        if self.instance and self.instance.user != self.context['request'].user:
            raise PermissionDenied
        if item_data.get('user') and item_data['user'] != self.context['request'].user:
            raise PermissionDenied
        if parent := item_data.get('parent'):
            if parent.user != self.context['request'].user:
                raise PermissionDenied
            if self.instance:
                if parent.id == self.instance.id:
                    raise ValidationError
                if parent.id in Item.descendants_ids(self.instance.id):
                    raise ValidationError
        return item_data


class ItemParentSerializer(serializers.Serializer):
    parent = serializers.UUIDField(allow_null=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs['parent'] is not None:
            if not Item.objects.filter(pk=attrs['parent'],
                                       user=self.context['request'].user).exists():
                raise ValidationError
        return attrs


class ItemsIDsSerializer(serializers.Serializer):
    items_ids = serializers.ListField(child=serializers.UUIDField())

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not Item.objects.filter(pk__in=attrs['items_ids'],
                                   user=self.context['request'].user).exists():
            raise ValidationError
        return attrs


class ItemBulkMoveSerializer(ItemParentSerializer, ItemsIDsSerializer):
    pass


class ItemTreeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ['text', 'collapsed', 'created', 'modified']

    def get_fields(self):
        fields = super(ItemTreeSerializer, self).get_fields()
        fields['children'] = ItemTreeSerializer(many=True, required=False)
        return fields
