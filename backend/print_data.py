import os
import django

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

# 모델 임포트
from navigation.models import Node, Edge

def print_nodes():
    print("--- 모든 Node 데이터 ---")
    nodes = Node.objects.all().values(
        'id', 'qr_id', 'name', 'floor', 'pixel_x', 'pixel_y', 'node_type'
    )
    for node in nodes:
        print(node)

def print_edges():
    print("\n--- 모든 Edge 데이터 ---")
    edges = Edge.objects.all().values(
        'id', 
        'start_node__name', 
        'end_node__name', 
        'weight'
    )
    for edge in edges:
        print(edge)

if __name__ == "__main__":
    print_nodes()
    print_edges()