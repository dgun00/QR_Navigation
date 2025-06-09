from django.db import models

class Node(models.Model):
    NODE_TYPE_CHOICES = [
        ('QR', 'QR Code Spot'),
        ('JUNCTION', 'Junction'),
        ('POI', 'Point of Interest'),
        ('ELEVATOR', 'Elevator'),
        ('STAIRS', 'Stairs'),
        ('ETC', 'Etc'),
    ]

    # QR코드에 저장될 고유 ID (이 필드가 핵심입니다!)
    qr_id = models.CharField(max_length=100, unique=True, null=True, blank=True, help_text="이 노드가 QR코드 위치일 경우, QR코드에 저장될 고유 ID")
    
    name = models.CharField(max_length=100, help_text="노드의 이름 또는 설명 (예: 1층 정문 앞 QR)")
    floor = models.CharField(max_length=10, help_text="층 정보 (예: 1F, B1)") # 프론트엔드가 이 정보로 지도 이미지를 선택
    # PNG 이미지의 (0,0)을 좌상단으로 가정하고, y는 세로축, x는 가로축 좌표
    pixel_x = models.IntegerField(help_text="PNG 이미지 상의 X 좌표 (픽셀)") # 마커의 가로 위치
    pixel_y = models.IntegerField(help_text="PNG 이미지 상의 Y 좌표 (픽셀)") # 마커의 세로 위치
    node_type = models.CharField(max_length=20, choices=NODE_TYPE_CHOICES, default='ETC', help_text="노드 유형")
    description = models.TextField(blank=True, null=True, help_text="노드에 대한 추가 설명")

    def __str__(self):
        return f"{self.name} ({self.floor} - QR: {self.qr_id or 'N/A'})"
    
class Edge(models.Model):
    start_node = models.ForeignKey(Node, related_name='starting_edges', on_delete=models.CASCADE, help_text="시작 노드")
    end_node = models.ForeignKey(Node, related_name='ending_edges', on_delete=models.CASCADE, help_text="도착 노드")
    weight = models.FloatField(default=1.0, help_text="가중치 (보통 노드 간의 픽셀 거리를 저장)")

    def __str__(self):
        return f"{self.start_node.name} -> {self.end_node.name} (가중치: {self.weight})"