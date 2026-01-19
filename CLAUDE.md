# Email Auto Sender - 개발 가이드

## 프로젝트 개요

Naver와 Google 메일을 기반으로 한 자동 메일링 웹 애플리케이션

### 주요 기능
- 멀티 메일 서비스 지원 (Naver, Google)
- 템플릿 변수 시스템 ({{변수명}} 형식)
- 리치 텍스트 에디터 (Quill)
- 이미지 삽입 및 위치 편집
- CC 설정
- 엑셀 파일 업로드 (대량 발송)
- 배치 처리 및 발송 간격 조절

## 기술 스택

### Backend
- **Python 3.9+**
- **FastAPI**: 웹 프레임워크
- **smtplib**: SMTP 메일 발송
- **pandas/openpyxl**: 엑셀 파일 처리
- **pydantic**: 데이터 검증
- **Uvicorn**: ASGI 서버

### Frontend
- **React 18**
- **React Bootstrap**: UI 컴포넌트
- **Quill**: 리치 텍스트 에디터
- **Axios**: HTTP 클라이언트
- **React Icons**: 아이콘

## 프로젝트 구조

```
email_auto_sender/
├── backend/
│   ├── app/
│   │   ├── routes/          # API 라우터
│   │   │   ├── email.py     # 메일 발송 API
│   │   │   ├── template.py  # 템플릿 관리 API
│   │   │   ├── recipient.py # 수신자 관리 API
│   │   │   └── upload.py    # 파일 업로드 API
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── email_service.py      # 메일 발송 서비스
│   │   │   └── template_service.py   # 템플릿 처리 서비스
│   │   ├── models/          # 데이터 모델
│   │   │   └── email.py     # 이메일 관련 모델
│   │   ├── config.py        # 설정
│   │   └── main.py          # 메인 앱
│   ├── uploads/             # 업로드된 파일
│   └── requirements.txt     # Python 패키지
├── frontend/
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── EmailEditor.js      # 메일 에디터
│   │   │   ├── RecipientManager.js # 수신자 관리
│   │   │   └── EmailSender.js      # 메일 발송
│   │   ├── services/
│   │   │   └── api.js       # API 클라이언트
│   │   ├── App.js           # 메인 앱
│   │   └── index.js         # 엔트리 포인트
│   └── package.json         # Node.js 패키지
├── data/                    # 데이터 저장 (JSON)
├── samples/                 # 샘플 파일
├── .env.example             # 환경 변수 예시
├── setup.sh                 # 설치 스크립트
├── start.sh                 # 실행 스크립트
├── stop.sh                  # 종료 스크립트
└── dev.sh                   # 개발 모드 스크립트
```

## API 엔드포인트

### 템플릿 관리
- `GET /api/template/` - 모든 템플릿 조회
- `POST /api/template/` - 템플릿 생성
- `GET /api/template/{id}` - 특정 템플릿 조회
- `PUT /api/template/{id}` - 템플릿 수정
- `DELETE /api/template/{id}` - 템플릿 삭제

### 수신자 관리
- `GET /api/recipient/` - 모든 수신자 조회
- `POST /api/recipient/` - 수신자 추가
- `POST /api/recipient/bulk` - 대량 수신자 추가
- `GET /api/recipient/{id}` - 특정 수신자 조회
- `PUT /api/recipient/{id}` - 수신자 수정
- `DELETE /api/recipient/{id}` - 수신자 삭제
- `DELETE /api/recipient/` - 모든 수신자 삭제

### 파일 업로드
- `POST /api/upload/excel` - 엑셀 파일 업로드
- `POST /api/upload/image` - 이미지 업로드
- `GET /api/upload/images` - 이미지 목록 조회
- `DELETE /api/upload/image/{filename}` - 이미지 삭제

### 이메일 발송
- `POST /api/email/send` - 단일 메일 발송
- `POST /api/email/send-bulk` - 대량 메일 발송
- `POST /api/email/preview` - 메일 미리보기
- `POST /api/email/validate-template` - 템플릿 검증

## 개발 환경 설정

### 1. 필수 요구사항
- Python 3.9 이상
- Node.js 16 이상
- npm 또는 yarn

### 2. 설치
```bash
# 저장소 클론
git clone https://github.com/Two-Jay/email_auto_sender.git
cd email_auto_sender

# 자동 설치
./setup.sh

# 수동 설치
# 백엔드
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 프론트엔드
cd frontend
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일 편집
```

### 4. 개발 서버 실행
```bash
# 자동 실행 (tmux 필요)
./dev.sh

# 수동 실행
# 터미널 1 - 백엔드
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 터미널 2 - 프론트엔드
cd frontend
npm start
```

## 주요 기능 구현

### 템플릿 변수 치환

템플릿에서 `{{변수명}}` 형식으로 변수를 사용합니다.

**backend/app/services/template_service.py:**
```python
def render_template(template: str, variables: Dict[str, str]) -> str:
    result = template
    for key, value in variables.items():
        pattern = r'\{\{' + re.escape(key) + r'\}\}'
        result = re.sub(pattern, str(value), result)
    return result
```

### 메일 발송

**backend/app/services/email_service.py:**
- SMTP 연결 및 인증
- 템플릿 변수 치환
- HTML 이메일 생성
- 배치 발송 (간격 조절)

### 엑셀 파일 처리

**backend/app/routes/upload.py:**
- pandas로 엑셀 파일 읽기
- email 열 필수 확인
- 나머지 열을 변수로 변환

### 이미지 업로드

**frontend/src/components/EmailEditor.js:**
- Quill 에디터의 이미지 핸들러 커스터마이징
- 파일 업로드 후 에디터에 삽입
- 서버에 이미지 저장

## 데이터 저장

JSON 파일 기반으로 데이터를 저장합니다:
- `data/templates.json` - 템플릿
- `data/recipients.json` - 수신자

## 보안 고려사항

1. **비밀번호 저장**: .env 파일은 git에 포함하지 않음
2. **CORS**: 허용된 도메인만 접근 가능
3. **파일 업로드**: 확장자 및 크기 검증
4. **이메일 발송**: 배치 크기 및 간격 제한

## Google 메일 설정

Google 메일을 사용하려면 "앱 비밀번호"가 필요합니다:

1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 16자리 비밀번호를 .env 파일에 입력

## Naver 메일 설정

Naver 메일은 일반 비밀번호를 사용합니다:
- SMTP 서버: smtp.naver.com
- 포트: 587 (TLS)

## 문제 해결

### 메일 발송 실패
- 발신자 이메일과 비밀번호 확인
- Google의 경우 앱 비밀번호 사용 확인
- SMTP 서버 주소와 포트 확인

### 엑셀 업로드 실패
- 파일 형식 확인 (.xlsx 또는 .xls)
- email 열 존재 여부 확인
- 파일 인코딩 확인

### 이미지 업로드 실패
- 파일 형식 확인 (jpg, png, gif 등)
- 업로드 디렉토리 권한 확인

## 향후 개선 사항

- [ ] 데이터베이스 연동 (PostgreSQL, MongoDB)
- [ ] 사용자 인증 시스템
- [ ] 발송 예약 기능
- [ ] 발송 결과 통계
- [ ] 첨부파일 지원 강화
- [ ] 이메일 템플릿 라이브러리
- [ ] 다국어 지원

## 라이센스

MIT License
