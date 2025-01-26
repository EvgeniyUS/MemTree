# import json
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
        if (parent := item_data.get('parent')) and not Item.objects.filter(
            pk=parent.id, user=self.context['request'].user).exists():
                raise PermissionDenied('Invalid parent.')
        return item_data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if self.context['request'].user != instance.user:
            raise PermissionDenied
        if validated_data.get('parent'):
            if instance == validated_data['parent']:
                raise ValidationError
            if validated_data['parent'] in instance.descendants:
                raise ValidationError
        # Pretty JSON template
        # try:
        #     validated_data['text'] = json.dumps(json.loads(validated_data['text']), indent=4)
        # except:
        #     pass
        return super().update(instance, validated_data)


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
