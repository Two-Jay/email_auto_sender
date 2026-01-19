from fastapi import APIRouter, HTTPException
from typing import List
import json
import os

from app.models import Recipient
from app.config import settings

router = APIRouter()

RECIPIENTS_FILE = os.path.join(settings.data_dir, "recipients.json")


def load_recipients() -> List[dict]:
    """수신자 파일 로드"""
    if not os.path.exists(RECIPIENTS_FILE):
        return []
    try:
        with open(RECIPIENTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading recipients: {e}")
        return []


def save_recipients(recipients: List[dict]):
    """수신자 파일 저장"""
    try:
        with open(RECIPIENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(recipients, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving recipients: {e}")
        raise HTTPException(status_code=500, detail="수신자 저장 실패")


@router.get("/", response_model=List[dict])
async def get_recipients():
    """모든 수신자 조회"""
    return load_recipients()


@router.post("/", response_model=dict)
async def create_recipient(recipient: Recipient):
    """새 수신자 추가"""
    recipients = load_recipients()

    # ID 생성
    new_id = max([r.get("id", 0) for r in recipients], default=0) + 1

    new_recipient = {
        "id": new_id,
        "email": recipient.email,
        "variables": recipient.variables
    }

    recipients.append(new_recipient)
    save_recipients(recipients)

    return new_recipient


@router.post("/bulk", response_model=dict)
async def create_recipients_bulk(recipients_data: List[Recipient]):
    """대량 수신자 추가"""
    recipients = load_recipients()

    # 현재 최대 ID 찾기
    max_id = max([r.get("id", 0) for r in recipients], default=0)

    new_recipients = []
    for i, recipient in enumerate(recipients_data):
        new_recipient = {
            "id": max_id + i + 1,
            "email": recipient.email,
            "variables": recipient.variables
        }
        new_recipients.append(new_recipient)

    recipients.extend(new_recipients)
    save_recipients(recipients)

    return {
        "message": f"{len(new_recipients)}명의 수신자가 추가되었습니다",
        "count": len(new_recipients)
    }


@router.get("/{recipient_id}", response_model=dict)
async def get_recipient(recipient_id: int):
    """특정 수신자 조회"""
    recipients = load_recipients()
    recipient = next((r for r in recipients if r.get("id") == recipient_id), None)

    if not recipient:
        raise HTTPException(status_code=404, detail="수신자를 찾을 수 없습니다")

    return recipient


@router.put("/{recipient_id}", response_model=dict)
async def update_recipient(recipient_id: int, recipient: Recipient):
    """수신자 수정"""
    recipients = load_recipients()

    for i, r in enumerate(recipients):
        if r.get("id") == recipient_id:
            recipients[i] = {
                "id": recipient_id,
                "email": recipient.email,
                "variables": recipient.variables
            }
            save_recipients(recipients)
            return recipients[i]

    raise HTTPException(status_code=404, detail="수신자를 찾을 수 없습니다")


@router.delete("/{recipient_id}")
async def delete_recipient(recipient_id: int):
    """수신자 삭제"""
    recipients = load_recipients()

    filtered_recipients = [r for r in recipients if r.get("id") != recipient_id]

    if len(filtered_recipients) == len(recipients):
        raise HTTPException(status_code=404, detail="수신자를 찾을 수 없습니다")

    save_recipients(filtered_recipients)

    return {"message": "수신자가 삭제되었습니다"}


@router.delete("/")
async def delete_all_recipients():
    """모든 수신자 삭제"""
    save_recipients([])
    return {"message": "모든 수신자가 삭제되었습니다"}
