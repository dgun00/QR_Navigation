import os
import django

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

# 모델 임포트
from navigation.models import Node, Edge

def print_nodes_for_sql():
    # 필드 리스트 (나중에 INSERT 문의 필드명으로 사용 가능)
    node_fields = ['id', 'qr_id', 'name', 'floor', 'pixel_x', 'pixel_y', 'node_type']
    print(f"--- Node 테이블 INSERT 값 형식 ---")
    print(f"-- INSERT INTO navigation_node ({', '.join(node_fields)}) VALUES")
    
    # values_list()를 사용하여 튜플 형태로 데이터를 가져옵니다.
    # flat=True를 사용하지 않음: 데이터 타입에 따라 문자열 변환이 필요할 수 있기 때문에 일반 튜플로 가져옵니다.
    nodes = Node.objects.all().values_list(*node_fields)
    
    for node in nodes:
        # 각 값을 문자열로 변환하고 쉼표와 공백으로 연결합니다.
        # SQL에서 문자열은 따옴표로 묶어야 하므로, 각 값에 따옴표를 추가합니다.
        
        # 튜플의 각 요소를 문자열로 변환하고, 문자열 값 주변에 작은따옴표를 붙입니다.
        formatted_values = []
        for value in node:
            if isinstance(value, str):
                # 문자열이면 작은따옴표로 감쌉니다.
                formatted_values.append(f"'{value}'")
            elif value is None:
                 # None 값이면 SQL의 NULL로 변환합니다.
                formatted_values.append("NULL")
            else:
                # 숫자 등 문자열이 아니면 그대로 사용합니다.
                formatted_values.append(str(value))
        
        # (값1, 값2, 값3) 형식으로 출력합니다.
        print(f"({', '.join(formatted_values)}),")

def print_edges_for_sql():
    # 필드 리스트
    edge_fields = ['id', 'start_node__name', 'end_node__name', 'weight']
    print("\n--- Edge 테이블 INSERT 값 형식 ---")
    print(f"-- 참고: start_node와 end_node는 ID 값이 아닌 이름(name)입니다. ")
    print(f"-- INSERT INTO navigation_edge (id, start_node_id, end_node_id, weight) VALUES")
    
    edges = Edge.objects.all().values_list(
        'id', 
        'start_node__id', 
        'end_node__id', 
        'weight'
    )
    
    for edge in edges:
        formatted_values = []
        for value in edge:
            if isinstance(value, str):
                formatted_values.append(f"'{value}'")
            elif value is None:
                formatted_values.append("NULL")
            else:
                formatted_values.append(str(value))
        
        print(f"({', '.join(formatted_values)}),")

if __name__ == "__main__":
    print_nodes_for_sql()
    print_edges_for_sql()