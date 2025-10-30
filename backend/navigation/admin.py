# navigation/admin.py
from django.contrib import admin
from .models import Node, Edge

@admin.register(Node)
class NodeAdmin(admin.ModelAdmin):
    list_display = ('name', 'qr_id', 'building', 'floor', 'node_type', 'pixel_x', 'pixel_y')
    list_filter = ('floor','building', 'node_type')
    search_fields = ('name', 'description', 'qr_id')

@admin.register(Edge)
class EdgeAdmin(admin.ModelAdmin):
    list_display = ('start_node', 'end_node', 'weight')
    # 노드가 많아질 경우 드롭다운 대신 검색으로 찾을 수 있게 해주는 설정
    raw_id_fields = ('start_node', 'end_node')