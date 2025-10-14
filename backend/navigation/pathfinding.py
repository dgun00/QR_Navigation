import heapq
import json
import math

class PathFinder:
    def __init__(self, graph: dict, locations: dict):
        self.graph = graph
        self.locations = locations

    def heuristic(self, node: str, goal: str) -> float:
        loc1 = self.locations.get(node)
        loc2 = self.locations.get(goal)
        if not loc1 or not loc2: return float("inf")
        x1, y1, floor1 = loc1["x"], loc1["y"], loc1["floor"]
        x2, y2, floor2 = loc2["x"], loc2["y"], loc2["floor"]
        try:
            # floor 값이 '1F' 같은 문자열일 경우를 대비해 숫자만 추출 시도
            floor_num1 = float("".join(filter(str.isdigit, str(floor1))))
            floor_num2 = float("".join(filter(str.isdigit, str(floor2))))
            floor_diff = floor_num1 - floor_num2
        except (ValueError, TypeError):
            floor_diff = 0 # 숫자 변환 실패 시 층 차이 없다고 가정
            
        floor_weight = 50 
        building_weight = 100
        building_penalty = 0
        if loc1.get("building") != loc2.get("building"): building_penalty = building_weight
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (floor_weight * floor_diff) ** 2) + building_penalty

    def astar(self, start: str, end: str) -> dict:
        print(f"\n[DEBUG] A* Algorithm Started. From '{start}' To '{end}'")
        if start not in self.graph:
            print(f"[DEBUG] ERROR: Start node '{start}' is not in the graph keys.")
            return {"path": [], "distance": None, "error": f"Start node '{start}' not in graph."}
        if end not in self.graph:
            print(f"[DEBUG] ERROR: End node '{end}' is not in the graph keys.")
            return {"path": [], "distance": None, "error": f"End node '{end}' not in graph."}

        open_set = [(0, start)]
        came_from = {}
        g_score = {node: float("inf") for node in self.graph}
        g_score[start] = 0
        f_score = {node: float("inf") for node in self.graph}
        f_score[start] = self.heuristic(start, end)

        while open_set:
            _, current = heapq.heappop(open_set)
            print(f"[DEBUG] Current node being processed: {current}")

            if current == end:
                print("[DEBUG] SUCCESS: Goal reached!")
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                path.reverse()
                return {"path": [{"id": n, **self.locations[n]} for n in path], "distance": g_score[end]}
            
            for neighbor, weight in self.graph.get(current, []):
                tentative_g = g_score[current] + weight
                if tentative_g < g_score.get(neighbor, float("inf")):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self.heuristic(neighbor, end)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))
                    
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

    print("\n--- [DEBUG] Data being passed to PathFinder ---")
    print("Locations:", json.dumps(locations, indent=2))
    print("Graph:", json.dumps(graph, indent=2))
    print("---------------------------------------------")

    finder = PathFinder(graph=graph, locations=locations)
    result = finder.astar(start=start_node_id, end=end_node_id)
    return result
