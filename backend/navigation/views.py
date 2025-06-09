# navigation/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Node, Edge
from .serializers import NodeSerializer
from .pathfinding import find_shortest_path

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

        # DB에서 모든 노드와 엣지 정보를 가져와 그래프 구성
        nodes = Node.objects.all()
        edges = Edge.objects.all()

        graph = {
            node.id: {'pos': (node.pixel_x, node.pixel_y), 'neighbors': {}}
            for node in nodes
        }
        for edge in edges:
            # 양방향 그래프로 구성 (만약 길이 일방통행이 아니라면)
            graph[edge.start_node_id]['neighbors'][edge.end_node_id] = edge.weight
            graph[edge.end_node_id]['neighbors'][edge.start_node_id] = edge.weight
        
        # 경로 탐색 알고리즘 실행
        path_node_ids = find_shortest_path(graph, start_node_id, end_node_id)
        
        if path_node_ids:
            # 경로에 해당하는 노드 객체들을 순서대로 가져옴
            path_nodes = sorted(Node.objects.filter(id__in=path_node_ids), key=lambda x: path_node_ids.index(x.id))
            serializer = NodeSerializer(path_nodes, many=True)
            return Response(serializer.data)
        else:
            return Response({"error": "경로를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)