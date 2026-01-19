import re
from typing import Dict


class TemplateService:
    """템플릿 변수 치환 서비스"""

    @staticmethod
    def render_template(template: str, variables: Dict[str, str]) -> str:
        """
        템플릿 문자열에서 변수를 치환합니다.

        Args:
            template: 템플릿 문자열 (예: "안녕하세요 {{name}}님")
            variables: 치환할 변수 딕셔너리 (예: {"name": "홍길동"})

        Returns:
            변수가 치환된 문자열
        """
        result = template

        # {{변수명}} 형식의 모든 변수를 찾아서 치환
        for key, value in variables.items():
            pattern = r'\{\{' + re.escape(key) + r'\}\}'
            result = re.sub(pattern, str(value), result)

        return result

    @staticmethod
    def extract_variables(template: str) -> list:
        """
        템플릿에서 사용된 변수명을 추출합니다.

        Args:
            template: 템플릿 문자열

        Returns:
            변수명 리스트
        """
        pattern = r'\{\{(\w+)\}\}'
        matches = re.findall(pattern, template)
        return list(set(matches))  # 중복 제거

    @staticmethod
    def validate_variables(template: str, variables: Dict[str, str]) -> tuple:
        """
        템플릿에 필요한 변수가 모두 제공되었는지 확인합니다.

        Args:
            template: 템플릿 문자열
            variables: 제공된 변수 딕셔너리

        Returns:
            (유효성, 누락된 변수 리스트)
        """
        required_vars = TemplateService.extract_variables(template)
        missing_vars = [var for var in required_vars if var not in variables]

        return (len(missing_vars) == 0, missing_vars)
