# navigation/serializers.py
from rest_framework import serializers
from .models import Node

class NodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = ['id', 'qr_id','building', 'name', 'floor', 'pixel_x', 'pixel_y', 'node_type', 'description']