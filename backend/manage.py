#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    
    # 🚨 경로 오류 해결: settings 파일의 정확한 전체 경로를 지정합니다.
    # 'project'는 backend 폴더 안에 있으므로 'backend'를 접두사로 사용해야 합니다.
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.project.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()