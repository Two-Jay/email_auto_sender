from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict

from app.models import EmailSendRequest, BulkEmailRequest, EmailSendResponse
from app.services import EmailService

router = APIRouter()
email_service = EmailService()


@router.post("/send", response_model=dict)
async def send_single_email(request: EmailSendRequest):
    """단일 메일 발송"""

    try:
        result = email_service.send_email(
            sender=request.sender,
            recipient=request.recipient,
            template=request.template,
            cc=request.cc,
            attachments=request.attachments
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "메일 발송 실패")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"메일 발송 중 오류 발생: {str(e)}"
        )


@router.post("/send-bulk", response_model=dict)
async def send_bulk_email(request: BulkEmailRequest):
    """대량 메일 발송"""

    try:
        if not request.recipients:
            raise HTTPException(
                status_code=400,
                detail="수신자가 없습니다"
            )

        results = await email_service.send_bulk_email(
            sender=request.sender,
            recipients=request.recipients,
            template=request.template,
            cc=request.cc,
            attachments=request.attachments
        )

        return {
            "success": results["failed"] == 0,
            "message": f"총 {results['total']}명 중 {results['success']}명에게 발송 성공",
            "total_sent": results["success"],
            "total_failed": results["failed"],
            "failed_recipients": results["failed_recipients"],
            "details": results["details"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"대량 메일 발송 중 오류 발생: {str(e)}"
        )


@router.post("/preview", response_model=dict)
async def preview_email(request: EmailSendRequest):
    """메일 미리보기 (실제 발송하지 않음)"""

    try:
        from app.services.template_service import TemplateService

        template_service = TemplateService()

        # 템플릿 변수 치환
        subject = template_service.render_template(
            request.template.subject,
            request.recipient.variables
        )
        html_content = template_service.render_template(
            request.template.html_content,
            request.recipient.variables
        )

        return {
            "recipient": request.recipient.email,
            "subject": subject,
            "html_content": html_content,
            "cc": request.cc
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"미리보기 생성 중 오류 발생: {str(e)}"
        )


@router.post("/validate-template", response_model=dict)
async def validate_template(template_subject: str, template_content: str, variables: Dict[str, str]):
    """템플릿 변수 유효성 검증"""

    try:
        from app.services.template_service import TemplateService

        template_service = TemplateService()

        # 제목과 내용에서 필요한 변수 추출
        subject_vars = template_service.extract_variables(template_subject)
        content_vars = template_service.extract_variables(template_content)
        all_required_vars = list(set(subject_vars + content_vars))

        # 누락된 변수 확인
        missing_vars = [var for var in all_required_vars if var not in variables]

        return {
            "valid": len(missing_vars) == 0,
            "required_variables": all_required_vars,
            "missing_variables": missing_vars,
            "provided_variables": list(variables.keys())
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"템플릿 검증 중 오류 발생: {str(e)}"
        )
