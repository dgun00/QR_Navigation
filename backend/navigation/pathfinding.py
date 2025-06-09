# navigation/pathfinding.py
import heapq
import math

# A* 알고리즘 함수
def find_shortest_path(graph, start_node_id, end_node_id):
    # A* 알고리즘의 핵심 로직: 우선순위 큐(heap) 사용
    # 우선순위 큐에는 (f_score, g_score, node_id)가 저장됨
    # f_score = g_score (시작점부터의 실제 비용) + h_score (목표까지의 추정 비용, 휴리스틱)
    
    # 각 노드의 g_score (시작점으로부터의 거리) 초기화
    g_scores = {node_id: float('inf') for node_id in graph}
    g_scores[start_node_id] = 0

    # 휴리스틱 함수 (두 노드 간의 직선 거리)
    def heuristic(node_id1, node_id2):
        pos1 = graph[node_id1]['pos']
        pos2 = graph[node_id2]['pos']
        return math.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
    
    # f_score 계산 및 우선순위 큐 초기화
    f_scores = {node_id: float('inf') for node_id in graph}
    f_scores[start_node_id] = heuristic(start_node_id, end_node_id)
    
    open_set = [(f_scores[start_node_id], start_node_id)]
    
    # 경로 추적을 위한 딕셔너리
    came_from = {}

    while open_set:
        # f_score가 가장 낮은 노드를 꺼냄
        _, current_node_id = heapq.heappop(open_set)
        
        # 목표에 도달하면 경로를 역추적하여 반환
        if current_node_id == end_node_id:
            path = []
            while current_node_id in came_from:
                path.append(current_node_id)
                current_node_id = came_from[current_node_id]
            path.append(start_node_id)
            return path[::-1]

        # 현재 노드와 연결된 이웃 노드들을 탐색
        for neighbor_id, weight in graph[current_node_id]['neighbors'].items():
            # 현재 노드를 거쳐 이웃 노드로 가는 g_score 계산
            tentative_g_score = g_scores[current_node_id] + weight
            
            # 더 짧은 경로를 발견한 경우
            if tentative_g_score < g_scores[neighbor_id]:
                came_from[neighbor_id] = current_node_id
                g_scores[neighbor_id] = tentative_g_score
                f_scores[neighbor_id] = tentative_g_score + heuristic(neighbor_id, end_node_id)
                
                # 우선순위 큐에 추가
                if (f_scores[neighbor_id], neighbor_id) not in open_set:
                    heapq.heappush(open_set, (f_scores[neighbor_id], neighbor_id))

    # 목표에 도달할 수 없는 경우
    return None