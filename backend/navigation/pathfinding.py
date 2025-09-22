import heapq
import json
import math

class PathFinder:
    def __init__(self, graph: dict, locations: dict):
        """
        - graph: 노드 간 연결 및 이동 비용을 정의한 딕셔너리.
        - locations: 각 노드의 3차원(x, y, floor) 위치와 건물 정보를 정의한 딕셔너리.
        """
        self.graph = graph
        self.locations = locations

    def heuristic(self, node: str, goal: str) -> float:
        """
        목적지까지의 추정 비용을 계산하는 휴리스틱 함수.
        3차원(x, y, floor) 유클리드 거리와 건물 간 이동 페널티를 고려합니다.
        """
        loc1 = self.locations.get(node)
        loc2 = self.locations.get(goal)

        if not loc1 or not loc2:
            return float("inf")

        x1, y1, floor1 = loc1["x"], loc1["y"], loc1["floor"]
        x2, y2, floor2 = loc2["x"], loc2["y"], loc2["floor"]
        
        # 층간 이동에 대한 가중치. 층 이동이 클수록 비용을 높게 설정
        floor_weight = 50 
        
        # 건물 간 이동에 대한 가중치. 건물 간 이동이 클수록 비용을 높게 설정
        building_weight = 100
        
        # 건물이 다를 경우 추가 페널티를 부여하여 최적 경로를 유도
        building_penalty = 0
        if loc1.get("building") != loc2.get("building"):
            building_penalty = building_weight

        # 3차원 유클리드 거리 + 건물 간 페널티
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (floor_weight * (floor1 - floor2)) ** 2) + building_penalty

    def astar(self, start: str, end: str) -> dict:
        """A* 알고리즘을 사용하여 최단 경로를 계산합니다."""
        if start not in self.graph or end not in self.graph:
            return {
                "path": [],
                "distance": None,
                "error": f"Invalid start ({start}) or end ({end}) node."
            }

        open_set = [(0, start)]  # (f_score, node)
        came_from = {}
        g_score = {node: float("inf") for node in self.graph}
        g_score[start] = 0
        f_score = {node: float("inf") for node in self.graph}
        f_score[start] = self.heuristic(start, end)

        while open_set:
            _, current = heapq.heappop(open_set)

            if current == end:
                # 경로 재구성 및 반환
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                path.reverse()
                
                return {
                    "path": [
                        {"id": n, **self.locations[n]} for n in path
                    ],
                    "distance": g_score[end]
                }

            for neighbor, weight in self.graph.get(current, []):
                tentative_g = g_score[current] + weight
                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self.heuristic(neighbor, end)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return {"path": [], "distance": None, "error": "경로를 탐색할 수 없습니다."}

if __name__ == '__main__':
    # --- A13 건물 1층 데이터를 반영한 graph_data 와 locations_data ---
    
    # 1. 위치 데이터: 각 노드의 3차원 위치 및 건물 정보
    locations_data = {
        # 2101-2116 라인
        "QR_A13_2101": {"x": 100, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2102": {"x": 150, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2103": {"x": 200, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2104": {"x": 250, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2105": {"x": 300, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2106": {"x": 350, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2107": {"x": 400, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2108": {"x": 450, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2109": {"x": 500, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2110": {"x": 550, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2111": {"x": 600, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2112": {"x": 650, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2113": {"x": 700, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2114": {"x": 750, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2115": {"x": 800, "y": 200, "floor": 1, "building": "A13"},
        "QR_A13_2116": {"x": 850, "y": 200, "floor": 1, "building": "A13"},
        
        # 2125-2136B 라인
        "QR_A13_2125": {"x": 200, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2126": {"x": 300, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2127": {"x": 400, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2129": {"x": 500, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2131": {"x": 600, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2134": {"x": 800, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2135": {"x": 850, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2136A": {"x": 900, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_2136B": {"x": 950, "y": 400, "floor": 1, "building": "A13"},

        # 복도 노드 (이동을 위해 방 입구와는 별도로 정의)
        "QR_A13_Corridor_1": {"x": 100, "y": 300, "floor": 1, "building": "A13"},
        "QR_A13_Corridor_2": {"x": 400, "y": 300, "floor": 1, "building": "A13"},
        "QR_A13_Corridor_3": {"x": 700, "y": 300, "floor": 1, "building": "A13"},
        "QR_A13_Corridor_4": {"x": 900, "y": 300, "floor": 1, "building": "A13"},

        # 주요 시설 노드 (계단, 화장실, 구름다리 등)
        "QR_A13_Stair_1F_West": {"x": 50, "y": 300, "floor": 1, "building": "A13"},
        "QR_A13_Stair_1F_Center": {"x": 600, "y": 300, "floor": 1, "building": "A13"}, # 중앙 계단 추가
        "QR_A13_Stair_1F_East": {"x": 950, "y": 300, "floor": 1, "building": "A13"},
        "QR_A13_Toilet_West": {"x": 150, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_Toilet_East": {"x": 750, "y": 400, "floor": 1, "building": "A13"},
        "QR_A13_To_CloudBridge_1F": {"x": 850, "y": 200, "floor": 1, "building": "A13"},
    }

    # 2. 그래프 데이터: 노드 간 연결 및 비용
    graph_data = {
        # 복도 노드 간 연결
        "QR_A13_Corridor_1": [("QR_A13_Corridor_2", 300)],
        "QR_A13_Corridor_2": [("QR_A13_Corridor_1", 300), ("QR_A13_Corridor_3", 300)],
        "QR_A13_Corridor_3": [("QR_A13_Corridor_2", 300), ("QR_A13_Corridor_4", 200)],
        "QR_A13_Corridor_4": [("QR_A13_Corridor_3", 200)],

        # 복도 노드와 방, 시설 노드 연결
        "QR_A13_Stair_1F_West": [("QR_A13_Corridor_1", 50)],
        "QR_A13_Corridor_1": [
            ("QR_A13_Stair_1F_West", 50), ("QR_A13_2101", 50), ("QR_A13_2102", 50),
            ("QR_A13_2103", 50), ("QR_A13_2104", 50), ("QR_A13_2105", 50),
            ("QR_A13_2106", 50)
        ],
        "QR_A13_2101": [("QR_A13_Corridor_1", 50)],
        "QR_A13_2102": [("QR_A13_Corridor_1", 50)],
        "QR_A13_2103": [("QR_A13_Corridor_1", 50)],
        "QR_A13_2104": [("QR_A13_Corridor_1", 50)],
        "QR_A13_2105": [("QR_A13_Corridor_1", 50)],
        "QR_A13_2106": [("QR_A13_Corridor_1", 50)],

        "QR_A13_Corridor_2": [
            ("QR_A13_2107", 50), ("QR_A13_2108", 50), ("QR_A13_2109", 50),
            ("QR_A13_2110", 50), ("QR_A13_2111", 50), ("QR_A13_2112", 50),
            ("QR_A13_2113", 50), ("QR_A13_2114", 50), ("QR_A13_2115", 50),
            ("QR_A13_2116", 50), ("QR_A13_Toilet_East", 50),
            ("QR_A13_2125", 50), ("QR_A13_2126", 50), ("QR_A13_2127", 50),
            ("QR_A13_2129", 50), ("QR_A13_2131", 50)
        ],
        # 위와 같이 각 방에서 복도 노드로의 연결을 추가해야 합니다.
        "QR_A13_Toilet_West": [("QR_A13_Corridor_1", 50)],
        "QR_A13_Toilet_East": [("QR_A13_Corridor_3", 50)],
        "QR_A13_Stair_1F_East": [("QR_A13_Corridor_4", 50)],
        
        # 계단 및 구름다리 노드 (외부 건물 또는 다른 층으로의 연결)
        "QR_A13_Stair_1F_West": [("QR_A13_Stair_2F_West", 30)],  # 층 이동
        "QR_A13_Stair_1F_Center": [("QR_A13_Stair_2F_Center", 30)], # 중앙 계단 층 이동
        "QR_A13_Stair_1F_East": [("QR_A13_Stair_2F_East", 30)],  # 층 이동
        "QR_A13_To_CloudBridge_1F": [("QR_OtherBuilding_Bridge_1F", 20)], # 구름다리 이동

        # 누락된 연결 및 기타 방 연결 (전체 복도를 고려하여 모든 노드를 연결해야 합니다)
        "QR_A13_Corridor_3": [("QR_A13_2117", 50), ("QR_A13_2118", 50), ("QR_A13_2119", 50), ("QR_A13_2120", 50), ("QR_A13_2121", 50), ("QR_A13_2122", 50), ("QR_A13_2123", 50)],
        "QR_A13_Corridor_4": [("QR_A13_2134", 50), ("QR_A13_2135", 50), ("QR_A13_2136A", 50), ("QR_A13_2136B", 50)],
        # 각 방에서 다시 복도 노드로 돌아오는 연결 추가
        "QR_A13_2117": [("QR_A13_Corridor_3", 50)],
        
        # 중앙 계단 노드를 복도와 연결
        "QR_A13_Corridor_2": [("QR_A13_Stair_1F_Center", 50)],
        "QR_A13_Stair_1F_Center": [("QR_A13_Corridor_2", 50)],
    }

    path_finder = PathFinder(graph_data, locations_data)

    # 예시: 서쪽 계단에서 2136B까지의 경로 탐색
    result = path_finder.astar("QR_A13_Stair_1F_West", "QR_A13_2136B")
    print("최종 경로 결과:")
    print(json.dumps(result, indent=4))
