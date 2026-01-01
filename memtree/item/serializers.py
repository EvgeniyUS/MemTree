from rest_framework import serializers
from rest_framework.exceptions import ValidationError, PermissionDenied
from item.models import Item


class ItemObjectSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, trim_whitespace=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Item
        read_only_fields = ['id', 'created', 'modified', 'user', 'children', 'children_count', 'path', 'path_list',
                            'length', 'rows', 'cols', 'alphabet']
        fields = read_only_fields + ['parent', 'collapsed', 'text']

    def validate(self, item_data):
        if item_data.get('user') and self.context['request'].user != item_data['user']:
            raise PermissionDenied
        if parent := item_data.get('parent'):
            if self.context['request'].user != parent.user:
                raise PermissionDenied
            if self.instance:
                if self.instance.uuid == parent.uuid:
                    raise ValidationError
                if parent.uuid in self.instance.descendants:
                    raise ValidationError
        return item_data


class ItemParentSerializer(serializers.Serializer):
    parent = serializers.IntegerField(allow_null=True)


class ItemsIDsSerializer(serializers.Serializer):
    items_ids = serializers.ListField(child=serializers.IntegerField())


class ItemBulkMoveSerializer(ItemParentSerializer, ItemsIDsSerializer):
    pass


class ItemTreeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ['id', 'parent', 'text']

    def get_fields(self):
        fields = super(ItemTreeSerializer, self).get_fields()
        fields['children'] = ItemTreeSerializer(many=True, required=False)
        return fields
