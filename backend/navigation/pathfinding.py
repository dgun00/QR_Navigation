# import heapq
# import json
# import math


# class PathFinder:
#     def __init__(self, graph: dict, locations: dict):
#         """
#         graph 예시:
#         {
#             "QR001": [("QR002", 5), ("QR003", 10)],
#             "QR002": [("QR004", 3)],
#             "QR003": [("QR004", 1)],
#             "QR004": []
#         }

#         locations 예시:
#         {
#             "QR001": {"x": 100, "y": 200},
#             "QR002": {"x": 150, "y": 200},
#             "QR003": {"x": 120, "y": 250},
#             "QR004": {"x": 200, "y": 300}
#         }
#         """
#         self.graph = graph
#         self.locations = locations

#     def heuristic(self, node: str, goal: str) -> float:
#         """유클리드 거리 기반 휴리스틱"""
#         x1, y1 = self.locations[node]["x"], self.locations[node]["y"]
#         x2, y2 = self.locations[goal]["x"], self.locations[goal]["y"]
#         return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

#     def astar(self, start: str, end: str) -> dict:
#         if start not in self.graph or end not in self.graph:
#             return {
#                 "path": [],
#                 "distance": None,
#                 "error": f"Invalid start ({start}) or end ({end}) node."
#             }

#         open_set = [(0, start)]
#         came_from = {}
#         g_score = {node: float("inf") for node in self.graph}
#         g_score[start] = 0
#         f_score = {node: float("inf") for node in self.graph}
#         f_score[start] = self.heuristic(start, end)

#         while open_set:
#             _, current = heapq.heappop(open_set)

#             if current == end:
#                 # 경로 재구성
#                 path = []
#                 while current in came_from:
#                     path.append(current)
#                     current = came_from[current]
#                 path.append(start)
#                 path.reverse()

#                 return {
#                     "path": [
#                         {"id": n, "x": self.locations[n]["x"], "y": self.locations[n]["y"]}
#                         for n in path
#                     ],
#                     "distance": g_score[end]
#                 }

#             for neighbor, weight in self.graph.get(current, []):
#                 tentative_g = g_score[current] + weight
#                 if tentative_g < g_score[neighbor]:
#                     came_from[neighbor] = current
#                     g_score[neighbor] = tentative_g
#                     f_score[neighbor] = tentative_g + self.heuristic(neighbor, end)
#                     heapq.heappush(open_set, (f_score[neighbor], neighbor))

#         return {"path": [], "distance": None, "error": "경로를 탐색할 수 없습니다."}

