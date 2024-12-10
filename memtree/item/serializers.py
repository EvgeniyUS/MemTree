from rest_framework import serializers
from rest_framework.exceptions import ValidationError, PermissionDenied
from item.models import Item


class ItemObjectSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, trim_whitespace=False, allow_null=True)

    class Meta:
        model = Item
        read_only_fields = ['id', 'user', 'children', 'children_count', 'path', 'path_list',
                            'length', 'rows', 'cols', 'alphabet']
        fields = read_only_fields + ['parent', 'collapsed', 'text']

    def validate(self, item_data):
        if self.instance:
            item_data['id'] = self.instance.id
            if not Item.tree_update_validation([item_data]):
                raise ValidationError
        return item_data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if self.context['request'].user != instance.user:
            raise PermissionDenied
        if validated_data.get('user') and self.context['request'].user != validated_data['user']:
            raise PermissionDenied
        return super().update(instance, validated_data)


class ItemTreeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ['id', 'parent', 'text']

    def get_fields(self):
        fields = super(ItemTreeSerializer, self).get_fields()
        fields['children'] = ItemTreeSerializer(many=True, required=False)
        return fields


class ItemBulkUpdateSerializer(serializers.ListSerializer):
    child = ItemObjectSerializer()

    def validate(self, attrs):
        for data in attrs:
            if not Item.objects.filter(user=self.context['request'].user,
                                       pk=data['id']).exists():
                raise PermissionDenied
        if not Item.tree_update_validation(attrs):
            raise ValidationError
        return attrs

    def update(self, queryset, validated_data):
        updated_objects = []
        for data in validated_data:
            if (item_id := data.pop('id', None)) and \
                (item := queryset.filter(user=self.context['request'].user, pk=item_id).first()):
                updated_objects.append(self.child.update(item, data))
        return updated_objects
