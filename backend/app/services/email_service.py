import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict
import os

from app.models import EmailProvider, SenderConfig, Recipient, EmailTemplate
from app.config import settings
from app.services.template_service import TemplateService


class EmailService:
    """메일 발송 서비스"""

    def __init__(self):
        self.template_service = TemplateService()

    def _get_smtp_config(self, provider: EmailProvider, email: str, password: str) -> Dict:
        """SMTP 설정 반환"""
        if provider == EmailProvider.NAVER:
            return {
                "server": settings.naver_smtp_server,
                "port": settings.naver_smtp_port,
                "email": email,
                "password": password
            }
        elif provider == EmailProvider.GOOGLE:
            return {
                "server": settings.google_smtp_server,
                "port": settings.google_smtp_port,
                "email": email,
                "password": password
            }
        else:
            raise ValueError(f"지원하지 않는 메일 제공자: {provider}")

    def _create_message(
        self,
        sender_email: str,
        sender_name: str,
        recipient_email: str,
        subject: str,
        html_content: str,
        cc: List[str] = None,
        attachments: List[str] = None
    ) -> MIMEMultipart:
        """이메일 메시지 생성"""

        # 메시지 객체 생성 (첨부파일이 있으면 mixed, 없으면 alternative)
        if attachments:
            message = MIMEMultipart("mixed")
        else:
            message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
        message["To"] = recipient_email

        # CC 추가
        if cc:
            message["Cc"] = ", ".join(cc)

        # HTML 본문 추가
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)

        # 첨부파일 추가
        if attachments:
            for file_path in attachments:
                if os.path.exists(file_path):
                    with open(file_path, "rb") as f:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        filename = os.path.basename(file_path)
                        part.add_header(
                            "Content-Disposition",
                            "attachment",
                            filename=("utf-8", "", filename)
                        )
                        message.attach(part)

        return message

    def send_email(
        self,
        sender: SenderConfig,
        recipient: Recipient,
        template: EmailTemplate,
        cc: List[str] = None,
        attachments: List[str] = None
    ) -> Dict:
        """단일 메일 발송"""

        try:
            # SMTP 설정 가져오기
            smtp_config = self._get_smtp_config(
                sender.provider,
                sender.email,
                sender.password
            )

            # 템플릿 변수 치환
            subject = self.template_service.render_template(
                template.subject,
                recipient.variables
            )
            html_content = self.template_service.render_template(
                template.html_content,
                recipient.variables
            )

            # 메시지 생성
            message = self._create_message(
                sender_email=smtp_config["email"],
                sender_name=sender.name or "",
                recipient_email=recipient.email,
                subject=subject,
                html_content=html_content,
                cc=cc,
                attachments=attachments
            )

            # SMTP 서버 연결 및 발송
            with smtplib.SMTP(smtp_config["server"], smtp_config["port"]) as server:
                server.starttls()  # TLS 암호화
                server.login(smtp_config["email"], smtp_config["password"])

                # 수신자 목록 (To + CC)
                recipients = [recipient.email]
                if cc:
                    recipients.extend(cc)

                server.sendmail(
                    smtp_config["email"],
                    recipients,
                    message.as_string()
                )

            return {
                "success": True,
                "message": f"{recipient.email}에게 메일을 발송했습니다",
                "recipient": recipient.email
            }

        except smtplib.SMTPAuthenticationError as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 인증 오류",
                "recipient": recipient.email,
                "error": "인증 실패 - 이메일 또는 비밀번호를 확인하세요"
            }
        except smtplib.SMTPRecipientsRefused as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 수신자 거부",
                "recipient": recipient.email,
                "error": "수신자 이메일 주소가 유효하지 않습니다"
            }
        except smtplib.SMTPSenderRefused as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 발신자 거부",
                "recipient": recipient.email,
                "error": "발신자 이메일 주소가 유효하지 않습니다"
            }
        except smtplib.SMTPDataError as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 데이터 오류",
                "recipient": recipient.email,
                "error": f"메일 내용 오류 - {str(e)}"
            }
        except smtplib.SMTPConnectError as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 연결 오류",
                "recipient": recipient.email,
                "error": "SMTP 서버 연결에 실패했습니다"
            }
        except smtplib.SMTPServerDisconnected as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 연결 끊김",
                "recipient": recipient.email,
                "error": "서버 연결이 끊어졌습니다"
            }
        except TimeoutError as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: 시간 초과",
                "recipient": recipient.email,
                "error": "서버 응답 시간이 초과되었습니다"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"{recipient.email} 발송 실패: {str(e)}",
                "recipient": recipient.email,
                "error": str(e)
            }

    async def send_bulk_email(
        self,
        sender: SenderConfig,
        recipients: List[Recipient],
        template: EmailTemplate,
        cc: List[str] = None,
        attachments: List[str] = None
    ) -> Dict:
        """대량 메일 발송"""

        results = {
            "total": len(recipients),
            "success": 0,
            "failed": 0,
            "failed_recipients": [],
            "details": []
        }

        # 배치 단위로 발송
        for i in range(0, len(recipients), settings.batch_size):
            batch = recipients[i:i + settings.batch_size]

            for recipient in batch:
                result = self.send_email(
                    sender=sender,
                    recipient=recipient,
                    template=template,
                    cc=cc,
                    attachments=attachments
                )

                results["details"].append(result)

                if result["success"]:
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    results["failed_recipients"].append({
                        "email": recipient.email,
                        "reason": result.get("error", "알 수 없는 오류")
                    })

                # 발송 간격 대기
                if settings.delay_between_emails > 0:
                    await asyncio.sleep(settings.delay_between_emails)

        return results
