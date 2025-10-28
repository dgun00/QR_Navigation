# navigation/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Node, Edge
from .serializers import NodeSerializer
#from .pathfinding import find_shortest_path

# QR ID로 특정 노드 정보 가져오기
class NodeByQrIdView(APIView):
    def get(self, request, qr_id):
        try:
            node = Node.objects.get(qr_id=qr_id)
            serializer = NodeSerializer(node)
            return Response(serializer.data)
        except Node.DoesNotExist:
            return Response({"error": "해당 QR ID의 노드를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    
# 목적지 검색 및 전체 노드 목록
class NodeSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('query', None)
        if query:
            nodes = Node.objects.filter(name__icontains=query) # 이름에 query를 포함하는 노드 검색
        else:
            nodes = Node.objects.all()
        
        serializer = NodeSerializer(nodes, many=True)
        return Response(serializer.data)

# 최단 경로 탐색
class PathfindView(APIView):
    def post(self, request):
        start_node_id = request.data.get('start_node_id')
        end_node_id = request.data.get('end_node_id')

        if not start_node_id or not end_node_id:
            return Response({"error": "출발지와 도착지 노드 ID를 모두 제공해야 합니다."}, status=status.HTTP_400_BAD_REQUEST)

        # DB에서 모든 노드와 엣지 정보를 가져옴 (QuerySet)
        all_nodes = Node.objects.all()
        all_edges = Edge.objects.select_related('start_node', 'end_node').all()

        # find_shortest_path 함수에 4개의 인자를 올바르게 전달합니다.
        result = find_shortest_path(start_node_id, end_node_id, all_nodes, all_edges)
        
        # 결과에 'error' 키가 있으면, 경로 탐색 실패 응답
        if result.get("error"):
            return Response({"error": result["error"]}, status=status.HTTP_404_NOT_FOUND)
        
        # 경로 탐색 성공 시, 결과 그대로 반환
        return Response(result, status=status.HTTP_200_OK)
            serializer = NodeSerializer(path_nodes, many=True)
            return Response(serializer.data)
        else:
            return Response({"error": "경로를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
