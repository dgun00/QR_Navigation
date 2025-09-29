import heapq
import json
import math

class PathFinder:
    def __init__(self, graph: dict, locations: dict):
        self.graph = graph
        self.locations = locations

    def heuristic(self, node: str, goal: str) -> float:
        # ... (이전과 동일) ...
        loc1 = self.locations.get(node)
        loc2 = self.locations.get(goal)
        if not loc1 or not loc2: return float("inf")
        x1, y1, floor1 = loc1["x"], loc1["y"], loc1["floor"]
        x2, y2, floor2 = loc2["x"], loc2["y"], loc2["floor"]
        try:
            floor_diff = float(floor1) - float(floor2)
        except (ValueError, TypeError):
            floor_diff = 0
        floor_weight = 50 
        building_weight = 100
        building_penalty = 0
        if loc1.get("building") != loc2.get("building"): building_penalty = building_weight
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (floor_weight * floor_diff) ** 2) + building_penalty

    def astar(self, start: str, end: str) -> dict:
        # --- [DEBUG] astar 시작점 확인 ---
        print(f"\n[DEBUG] A* Algorithm Started. From '{start}' To '{end}'")
        if start not in self.graph:
            print(f"[DEBUG] ERROR: Start node '{start}' is not in the graph keys.")
            return {"path": [], "distance": None, "error": f"Start node '{start}' not in graph."}
        if end not in self.graph:
            print(f"[DEBUG] ERROR: End node '{end}' is not in the graph keys.")
            return {"path": [], "distance": None, "error": f"End node '{end}' not in graph."}
        # --- [DEBUG] ---

        open_set = [(0, start)]
        came_from = {}
        g_score = {node: float("inf") for node in self.graph}
        g_score[start] = 0
        f_score = {node: float("inf") for node in self.graph}
        f_score[start] = self.heuristic(start, end)

        # --- [DEBUG] 초기값 확인 ---
        print(f"[DEBUG] Initial g_score for start node: {g_score[start]}")
        print(f"[DEBUG] Initial f_score for start node: {f_score[start]}")
        # --- [DEBUG] ---

        while open_set:
            _, current = heapq.heappop(open_set)
            
            # --- [DEBUG] 현재 탐색 노드 확인 ---
            print(f"[DEBUG] Current node being processed: {current}")
            # --- [DEBUG] ---

            if current == end:
                print("[DEBUG] SUCCESS: Goal reached!")
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                path.reverse()
                return {"path": [{"id": n, **self.locations[n]} for n in path], "distance": g_score[end]}
        
        print("[DEBUG] FAILURE: Open set is empty but goal was not reached.")
        return {"path": [], "distance": None, "error": "경로를 탐색할 수 없습니다."}


def find_shortest_path(start_node_id: str, end_node_id: str, nodes_qs, edges_qs) -> dict:
    locations = {
        node.qr_id: {"x": node.pixel_x, "y": node.pixel_y, "floor": node.floor, "building": node.building}
        for node in nodes_qs if node.qr_id
    }
    graph = {node.qr_id: [] for node in nodes_qs if node.qr_id}
    for edge in edges_qs:
        if edge.start_node and edge.start_node.qr_id and edge.end_node and edge.end_node.qr_id:
            graph[edge.start_node.qr_id].append((edge.end_node.qr_id, edge.weight))
            graph[edge.end_node.qr_id].append((edge.start_node.qr_id, edge.weight))

    # --- [DEBUG] 생성된 그래프와 로케이션 정보 확인 ---
    print("\n--- [DEBUG] Data being passed to PathFinder ---")
    print("Locations:", json.dumps(locations, indent=2))
    print("Graph:", json.dumps(graph, indent=2))
    print("---------------------------------------------")
    # --- [DEBUG] ---

    finder = PathFinder(graph=graph, locations=locations)
    result = finder.astar(start=start_node_id, end=end_node_id)
    return result
