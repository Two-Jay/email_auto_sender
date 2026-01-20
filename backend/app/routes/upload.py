from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import pandas as pd
import os
import shutil
from datetime import datetime

from app.config import settings
from app.models import Recipient

router = APIRouter()


@router.post("/excel")
async def upload_excel(file: UploadFile = File(...)):
    """엑셀 파일 업로드 및 수신자 데이터 파싱"""

    # 파일 확장자 확인
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="엑셀 파일만 업로드 가능합니다 (.xlsx, .xls)"
        )

    try:
        # 임시 파일로 저장
        temp_path = os.path.join(settings.upload_dir, f"temp_{file.filename}")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 엑셀 파일 읽기
        df = pd.read_excel(temp_path)

        # 임시 파일 삭제
        os.remove(temp_path)

        # email 열 확인
        if 'email' not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="엑셀 파일에 'email' 열이 필요합니다"
            )

        # 수신자 데이터 생성
        recipients = []
        for _, row in df.iterrows():
            email = str(row['email']).strip()

            # 이메일 유효성 간단 체크
            if not email or '@' not in email:
                continue

            # 나머지 열을 변수로 변환
            variables = {}
            for col in df.columns:
                if col != 'email':
                    value = row[col]
                    # NaN 처리
                    if pd.notna(value):
                        variables[col] = str(value)

            recipients.append({
                "email": email,
                "variables": variables
            })

        return {
            "success": True,
            "message": f"{len(recipients)}명의 수신자 데이터를 파싱했습니다",
            "recipients": recipients,
            "count": len(recipients)
        }

    except Exception as e:
        # 에러 발생시 임시 파일 정리
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=500,
            detail=f"엑셀 파일 처리 중 오류 발생: {str(e)}"
        )


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """이미지 파일 업로드"""

    # 이미지 확장자 확인
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원되는 이미지 형식: {', '.join(allowed_extensions)}"
        )

    try:
        # 고유 파일명 생성 (타임스탬프 포함)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, filename)

        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # URL 반환
        file_url = f"/uploads/{filename}"

        return {
            "success": True,
            "message": "이미지가 업로드되었습니다",
            "filename": filename,
            "url": file_url
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"이미지 업로드 중 오류 발생: {str(e)}"
        )


@router.get("/images")
async def get_uploaded_images():
    """업로드된 이미지 목록 조회"""
    try:
        if not os.path.exists(settings.upload_dir):
            return {"images": []}

        images = []
        for filename in os.listdir(settings.upload_dir):
            if filename == '.gitkeep':
                continue

            file_ext = os.path.splitext(filename)[1].lower()
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                images.append({
                    "filename": filename,
                    "url": f"/uploads/{filename}"
                })

        return {"images": images}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"이미지 목록 조회 중 오류 발생: {str(e)}"
        )


@router.delete("/image/{filename}")
async def delete_image(filename: str):
    """업로드된 이미지 삭제"""
    try:
        file_path = os.path.join(settings.upload_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

        os.remove(file_path)

        return {"success": True, "message": "이미지가 삭제되었습니다"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"이미지 삭제 중 오류 발생: {str(e)}"
        )


# 첨부파일 관련 설정
ATTACHMENT_ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.zip', '.rar', '.7z',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'
]
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/attachment")
async def upload_attachment(file: UploadFile = File(...)):
    """첨부파일 업로드"""

    # 파일 확장자 확인
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in ATTACHMENT_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(ATTACHMENT_ALLOWED_EXTENSIONS)}"
        )

    try:
        # 파일 내용 읽기
        contents = await file.read()

        # 파일 크기 확인
        if len(contents) > MAX_ATTACHMENT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"파일 크기가 너무 큽니다. 최대 {MAX_ATTACHMENT_SIZE // (1024 * 1024)}MB까지 업로드 가능합니다."
            )

        # 첨부파일 디렉토리 생성
        attachments_dir = os.path.join(settings.upload_dir, "attachments")
        os.makedirs(attachments_dir, exist_ok=True)

        # 고유 파일명 생성 (타임스탬프 포함)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # 파일명에서 안전하지 않은 문자 제거
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in '.-_')
        filename = f"{timestamp}_{safe_filename}"
        file_path = os.path.join(attachments_dir, filename)

        # 파일 저장
        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        return {
            "success": True,
            "message": "첨부파일이 업로드되었습니다",
            "filename": filename,
            "original_name": file.filename,
            "path": file_path,
            "size": len(contents)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"첨부파일 업로드 중 오류 발생: {str(e)}"
        )


@router.get("/attachments")
async def get_uploaded_attachments():
    """업로드된 첨부파일 목록 조회"""
    try:
        attachments_dir = os.path.join(settings.upload_dir, "attachments")

        if not os.path.exists(attachments_dir):
            return {"attachments": []}

        attachments = []
        for filename in os.listdir(attachments_dir):
            if filename == '.gitkeep':
                continue

            file_path = os.path.join(attachments_dir, filename)
            file_size = os.path.getsize(file_path)

            attachments.append({
                "filename": filename,
                "path": file_path,
                "size": file_size
            })

        return {"attachments": attachments}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"첨부파일 목록 조회 중 오류 발생: {str(e)}"
        )


@router.delete("/attachment/{filename}")
async def delete_attachment(filename: str):
    """업로드된 첨부파일 삭제"""
    try:
        attachments_dir = os.path.join(settings.upload_dir, "attachments")
        file_path = os.path.join(attachments_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

        os.remove(file_path)

        return {"success": True, "message": "첨부파일이 삭제되었습니다"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"첨부파일 삭제 중 오류 발생: {str(e)}"
        )
