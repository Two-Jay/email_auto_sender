# Email Auto Sender

Naver와 Google 메일을 기반으로 한 자동 메일링 웹 애플리케이션

## 주요 기능

- ✉️ **멀티 메일 서비스 지원**: Naver, Google 메일 계정 사용 가능
- 📝 **템플릿 변수 시스템**: 수신자별로 다른 변수값 적용 가능
- 🖼️ **리치 텍스트 에디터**: 이미지 삽입 및 위치 편집 지원
- 📧 **CC 설정**: 참조 수신자 별도 관리
- 📊 **엑셀 연동**: 대량 발송시 주소와 변수를 엑셀로 관리
- 🚀 **대량 발송**: 배치 처리 및 발송 간격 조절

## 기술 스택

### Backend
- **Python 3.9+**
- **FastAPI**: 고성능 웹 프레임워크
- **smtplib**: 메일 발송
- **pandas/openpyxl**: 엑셀 파일 처리
- **python-multipart**: 파일 업로드

### Frontend
- **React 18**
- **Quill**: 리치 텍스트 에디터
- **Axios**: HTTP 클라이언트
- **React Bootstrap**: UI 컴포넌트

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/Two-Jay/email_auto_sender.git
cd email_auto_sender
```

### 2. 자동 설치

#### Windows

```cmd
setup.bat
```

실행 후 `.env` 파일을 열어 메일 계정 정보를 입력하세요.

#### Linux/Mac

```bash
chmod +x setup.sh
./setup.sh
```

실행 후 `.env` 파일을 열어 메일 계정 정보를 입력하세요.

### 3. 수동 설치 (선택사항)

<details>
<summary>수동으로 설치하기</summary>

**환경 변수 설정:**
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

**백엔드 설정:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

**프론트엔드 설정:**
```bash
cd frontend
npm install
cd ..
```

</details>

## 실행 방법

### 🚀 빠른 시작 (권장)

#### Windows

**개발 모드:**
```cmd
dev.bat
```

**프로덕션 모드:**
```cmd
start.bat
```

**종료:**
```cmd
stop.bat
```

#### Linux/Mac

**개발 모드:**
```bash
./dev.sh
```

**프로덕션 모드:**
```bash
./start.sh
```

**종료:**
```bash
./stop.sh
```

### 📝 수동 실행

<details>
<summary>수동으로 실행하기</summary>

**백엔드 실행:**
```bash
cd backend

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**프론트엔드 실행 (새 터미널):**
```bash
cd frontend
npm start
```

</details>

### 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 사용 방법

### 1. 메일 발신자 설정
- Naver 또는 Google 메일 계정 정보 입력
- Google의 경우 "앱 비밀번호" 사용 권장

### 2. 수신자 관리
- 개별 추가: 이메일 주소와 변수값 직접 입력
- 엑셀 업로드: 대량 수신자 정보 일괄 등록

### 3. 메일 템플릿 작성
- 리치 텍스트 에디터로 메일 내용 작성
- 변수 사용: `{{이름}}`, `{{회사}}` 등의 형식으로 입력
- 이미지 삽입 및 위치 조절

### 4. CC 설정
- 참조로 받을 이메일 주소 추가

### 5. 발송
- 미리보기로 최종 확인
- 발송 시작

## 엑셀 파일 형식

수신자 정보를 담은 엑셀 파일은 다음 형식을 따라야 합니다:

| email | name | company | ... |
|-------|------|---------|-----|
| user1@example.com | 홍길동 | A회사 | ... |
| user2@example.com | 김철수 | B회사 | ... |

- 첫 번째 행: 헤더 (변수명)
- `email` 열은 필수
- 나머지 열은 템플릿에서 사용할 변수명과 일치해야 함

## 필수 요구사항

### Windows
- Python 3.9 이상
- Node.js 16 이상
- Git Bash 또는 CMD

### Linux/Mac
- Python 3.9 이상
- Node.js 16 이상
- Bash

## Google 메일 설정

Google 메일을 사용하려면 **앱 비밀번호**가 필요합니다:

1. [Google 계정 설정](https://myaccount.google.com/) → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 16자리 비밀번호를 `.env` 파일에 입력

## Naver 메일 설정

Naver 메일은 일반 비밀번호를 사용합니다:
- SMTP 서버: smtp.naver.com
- 포트: 587 (TLS)

## 라이센스

MIT License

## 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!
