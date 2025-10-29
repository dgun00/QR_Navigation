# backend/navigation/apps.py 수정

from django.apps import AppConfig

class NavigationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # 'navigation' 대신 'backend.navigation'으로 변경
    name = 'backend.navigation'