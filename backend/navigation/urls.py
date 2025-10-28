# navigation/urls.py
from django.urls import path
from .views import NodeByQrIdView, NodeSearchView, PathfindView

urlpatterns = [
    # 목적지 검색 또는 전체 노드 목록 (예: /api/navigation/nodes/?query=101호)
    path('nodes/', NodeSearchView.as_view(), name='node-search'),
    
    # QR코드로 현재 위치 정보 조회 (예: /api/navigation/nodes/qr/QR_ENTRANCE_1F/)
    path('nodes/qr/<str:qr_id>/', NodeByQrIdView.as_view(), name='node-by-qr-id'),
    
    # 최단 경로 탐색 요청 (POST 방식) (예: /api/navigation/pathfind/)
    path('pathfind/', PathfindView.as_view(), name='pathfind'),
]