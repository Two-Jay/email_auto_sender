from fastapi import APIRouter, HTTPException
from typing import List
import json
import os

from app.models import EmailTemplate
from app.config import settings

router = APIRouter()

TEMPLATES_FILE = os.path.join(settings.data_dir, "templates.json")


def load_templates() -> List[dict]:
    """템플릿 파일 로드"""
    if not os.path.exists(TEMPLATES_FILE):
        return []
    try:
        with open(TEMPLATES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading templates: {e}")
        return []


def save_templates(templates: List[dict]):
    """템플릿 파일 저장"""
    try:
        with open(TEMPLATES_FILE, "w", encoding="utf-8") as f:
            json.dump(templates, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving templates: {e}")
        raise HTTPException(status_code=500, detail="템플릿 저장 실패")


@router.get("/", response_model=List[dict])
async def get_templates():
    """모든 템플릿 조회"""
    return load_templates()


@router.post("/", response_model=dict)
async def create_template(template: EmailTemplate):
    """새 템플릿 생성"""
    templates = load_templates()

    # ID 생성 (가장 큰 ID + 1)
    new_id = max([t.get("id", 0) for t in templates], default=0) + 1

    new_template = {
        "id": new_id,
        "subject": template.subject,
        "html_content": template.html_content
    }

    templates.append(new_template)
    save_templates(templates)

    return new_template


@router.get("/{template_id}", response_model=dict)
async def get_template(template_id: int):
    """특정 템플릿 조회"""
    templates = load_templates()
    template = next((t for t in templates if t.get("id") == template_id), None)

    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    return template


@router.put("/{template_id}", response_model=dict)
async def update_template(template_id: int, template: EmailTemplate):
    """템플릿 수정"""
    templates = load_templates()

    for i, t in enumerate(templates):
        if t.get("id") == template_id:
            templates[i] = {
                "id": template_id,
                "subject": template.subject,
                "html_content": template.html_content
            }
            save_templates(templates)
            return templates[i]

    raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")


@router.delete("/{template_id}")
async def delete_template(template_id: int):
    """템플릿 삭제"""
    templates = load_templates()

    filtered_templates = [t for t in templates if t.get("id") != template_id]

    if len(filtered_templates) == len(templates):
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다")

    save_templates(filtered_templates)

    return {"message": "템플릿이 삭제되었습니다"}
