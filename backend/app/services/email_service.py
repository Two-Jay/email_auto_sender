import smtplib
import asyncio
import re
import uuid
import mimetypes
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email import encoders
from typing import List, Dict, Tuple
import os

from app.models import EmailProvider, SenderConfig, Recipient, EmailTemplate
from app.config import settings
from app.services.template_service import TemplateService


class EmailService:
    """메일 발송 서비스"""

    def __init__(self):
        self.template_service = TemplateService()

    def _process_images_in_html(self, html_content: str) -> Tuple[str, List[Tuple[str, bytes, str]]]:
        """
        HTML 내 이미지를 CID 참조로 변환하고 이미지 데이터를 추출

        Returns:
            Tuple[str, List[Tuple[str, bytes, str]]]:
                - 변환된 HTML
                - [(cid, image_data, mime_subtype), ...] 리스트
        """
        images_to_attach = []

        # 이미지 태그 패턴: src 속성과 width/height 스타일 보존
        img_pattern = re.compile(
            r'<img\s+([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>',
            re.IGNORECASE | re.DOTALL
        )

        def replace_image(match):
            before_src = match.group(1)
            img_url = match.group(2)
            after_src = match.group(3)

            # localhost URL 또는 /uploads/ 경로 처리
            local_path = None
            if 'localhost:8000/uploads/' in img_url:
                # http://localhost:8000/uploads/filename
                filename = img_url.split('/uploads/')[-1]
                local_path = os.path.join(settings.upload_dir, filename)
            elif img_url.startswith('/uploads/'):
                # /uploads/filename
                filename = img_url[9:]  # '/uploads/' 제거
                local_path = os.path.join(settings.upload_dir, filename)

            if local_path and os.path.exists(local_path):
                # CID 생성
                cid = f"image_{uuid.uuid4().hex[:8]}"

                # 이미지 파일 읽기
                with open(local_path, 'rb') as f:
                    image_data = f.read()

                # MIME 타입 결정
                mime_type, _ = mimetypes.guess_type(local_path)
                if mime_type and mime_type.startswith('image/'):
                    mime_subtype = mime_type.split('/')[1]
                else:
                    mime_subtype = 'png'  # 기본값

                images_to_attach.append((cid, image_data, mime_subtype))

                # width/height 속성이 있는지 확인하고 style로 변환
                full_attrs = before_src + after_src

                # 기존 width/height 속성 추출
                width_match = re.search(r'width=["\']?(\d+(?:px)?)["\']?', full_attrs, re.IGNORECASE)
                height_match = re.search(r'height=["\']?(\d+(?:px)?)["\']?', full_attrs, re.IGNORECASE)

                # style 속성에서 width/height 추출
                style_match = re.search(r'style=["\']([^"\']*)["\']', full_attrs, re.IGNORECASE)

                # 새로운 style 구성
                style_parts = []
                if style_match:
                    existing_style = style_match.group(1)
                    # width/height가 이미 style에 있으면 그대로 사용
                    if 'width' in existing_style or 'height' in existing_style:
                        style_parts.append(existing_style)
                    else:
                        style_parts.append(existing_style)
                        if width_match:
                            w = width_match.group(1)
                            if not w.endswith('px'):
                                w += 'px'
                            style_parts.append(f'width:{w}')
                        if height_match:
                            h = height_match.group(1)
                            if not h.endswith('px'):
                                h += 'px'
                            style_parts.append(f'height:{h}')
                else:
                    if width_match:
                        w = width_match.group(1)
                        if not w.endswith('px'):
                            w += 'px'
                        style_parts.append(f'width:{w}')
                    if height_match:
                        h = height_match.group(1)
                        if not h.endswith('px'):
                            h += 'px'
                        style_parts.append(f'height:{h}')

                # 속성 재구성 (width/height 속성 제거, style 추가)
                cleaned_before = re.sub(r'\s*width=["\']?[^"\'\s>]+["\']?', '', before_src, flags=re.IGNORECASE)
                cleaned_after = re.sub(r'\s*width=["\']?[^"\'\s>]+["\']?', '', after_src, flags=re.IGNORECASE)
                cleaned_before = re.sub(r'\s*height=["\']?[^"\'\s>]+["\']?', '', cleaned_before, flags=re.IGNORECASE)
                cleaned_after = re.sub(r'\s*height=["\']?[^"\'\s>]+["\']?', '', cleaned_after, flags=re.IGNORECASE)
                cleaned_before = re.sub(r'\s*style=["\'][^"\']*["\']', '', cleaned_before, flags=re.IGNORECASE)
                cleaned_after = re.sub(r'\s*style=["\'][^"\']*["\']', '', cleaned_after, flags=re.IGNORECASE)

                style_attr = f' style="{"; ".join(style_parts)}"' if style_parts else ''

                return f'<img{cleaned_before}src="cid:{cid}"{cleaned_after}{style_attr}>'

            # 로컬 이미지가 아니면 원본 유지
            return match.group(0)

        processed_html = img_pattern.sub(replace_image, html_content)
        return processed_html, images_to_attach

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
        """이메일 메시지 생성 (인라인 이미지 CID 첨부 지원)"""

        # HTML에서 로컬 이미지 URL을 CID 참조로 변환
        processed_html, embedded_images = self._process_images_in_html(html_content)

        # 최상위 메시지 객체 생성
        # 구조: mixed (첨부파일) > related (인라인 이미지) > alternative > html
        if attachments:
            message = MIMEMultipart("mixed")
        elif embedded_images:
            message = MIMEMultipart("related")
        else:
            message = MIMEMultipart("alternative")

        message["Subject"] = subject
        message["From"] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
        message["To"] = recipient_email

        # CC 추가
        if cc:
            message["Cc"] = ", ".join(cc)

        # 인라인 이미지가 있는 경우 related 컨테이너 생성
        if embedded_images:
            if attachments:
                # mixed > related > alternative
                related_part = MIMEMultipart("related")
                alternative_part = MIMEMultipart("alternative")
                html_part = MIMEText(processed_html, "html", "utf-8")
                alternative_part.attach(html_part)
                related_part.attach(alternative_part)

                # 인라인 이미지 첨부
                for cid, image_data, mime_subtype in embedded_images:
                    img = MIMEImage(image_data, _subtype=mime_subtype)
                    img.add_header("Content-ID", f"<{cid}>")
                    img.add_header("Content-Disposition", "inline", filename=f"{cid}.{mime_subtype}")
                    related_part.attach(img)

                message.attach(related_part)
            else:
                # related > alternative (message가 이미 related)
                alternative_part = MIMEMultipart("alternative")
                html_part = MIMEText(processed_html, "html", "utf-8")
                alternative_part.attach(html_part)
                message.attach(alternative_part)

                # 인라인 이미지 첨부
                for cid, image_data, mime_subtype in embedded_images:
                    img = MIMEImage(image_data, _subtype=mime_subtype)
                    img.add_header("Content-ID", f"<{cid}>")
                    img.add_header("Content-Disposition", "inline", filename=f"{cid}.{mime_subtype}")
                    message.attach(img)
        else:
            # 인라인 이미지가 없는 경우
            html_part = MIMEText(processed_html, "html", "utf-8")
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
