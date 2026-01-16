# 📧 이메일 자동 발신 웹앱

Excel/XML 파일에서 수신자 목록을 불러와 개인화된 이메일을 자동으로 발송하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **📝 인터랙티브 이메일 편집기**: Quill 에디터를 사용한 WYSIWYG 이메일 작성
  - 이미지 삽입 및 위치 조정
  - 다양한 텍스트 포맷팅 (굵게, 기울임, 색상, 정렬 등)
  - HTML 이메일 자동 생성

- **🎯 템플릿 변수 시스템**: 개인화된 이메일 발송
  - `{{name}}`, `{{email}}` 등의 변수 사용
  - 수신자별 맞춤 내용 자동 생성
  - 템플릿 저장 및 재사용

- **👥 수신자 관리**:
  - Excel(.xlsx, .xls) 파일 업로드 지원
  - XML 파일 업로드 지원
  - 수신자 그룹 관리
  - 파일 미리보기 기능

- **✉️ 발신자 관리**:
  - 여러 발신자 등록 및 관리
  - 기본 발신자 설정
  - 발신자별로 이메일 발송

- **📤 이메일 발송**:
  - 단일/일괄 발송 지원
  - 발송 전 미리보기
  - SMTP 연결 상태 확인
  - 발송 간 딜레이 설정 (스팸 방지)

## 🏗️ 프로젝트 구조

```
email_auto_sender/
├── backend/                 # Node.js + Express 백엔드
│   ├── src/
│   │   ├── routes/         # API 라우트
│   │   │   ├── email.js    # 이메일 발송 API
│   │   │   ├── template.js # 템플릿 관리 API
│   │   │   ├── recipient.js # 수신자 관리 API
│   │   │   └── sender.js   # 발신자 관리 API
│   │   ├── services/       # 비즈니스 로직
│   │   │   ├── emailService.js      # 이메일 발송 서비스
│   │   │   ├── templateService.js   # 템플릿 처리 서비스
│   │   │   └── fileParserService.js # 파일 파싱 서비스
│   │   ├── utils/          # 유틸리티
│   │   │   └── dataStore.js # JSON 파일 데이터 저장소
│   │   ├── data/           # JSON 데이터 파일
│   │   └── server.js       # 서버 진입점
│   ├── uploads/            # 업로드된 파일
│   └── package.json
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── EmailEditor.js    # Quill 에디터
│   │   │   └── FileUploader.js   # 파일 업로드
│   │   ├── services/
│   │   │   └── apiService.js     # API 통신
│   │   ├── App.js          # 메인 앱
│   │   └── index.js
│   ├── public/
│   └── package.json
├── .env.example            # 환경변수 예제
├── .gitignore
├── CLAUDE.md               # AI 어시스턴트 가이드
└── README.md               # 이 파일
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- SMTP 서버 접근 권한 (Gmail, SendGrid 등)

### 빠른 시작 (추천)

배쉬 스크립트를 사용하여 한 번에 설치하고 실행할 수 있습니다:

```bash
# 1. 설치
./setup.sh

# 2. .env 파일 수정 (SMTP 설정)
nano .env  # 또는 vi .env

# 3. 실행
./start.sh
```

브라우저에서 `http://localhost:3000`을 엽니다.

### 사용 가능한 스크립트

| 스크립트 | 설명 | 명령어 |
|---------|------|--------|
| **setup.sh** | 의존성 설치 및 초기 설정 | `./setup.sh` |
| **start.sh** | 백그라운드로 서버 시작 | `./start.sh` |
| **stop.sh** | 실행 중인 서버 중지 | `./stop.sh` |
| **dev.sh** | 개발 모드 (별도 터미널) | `./dev.sh` |

### 수동 설치 및 실행

스크립트를 사용하지 않고 수동으로 설치하려면:

#### 1. 저장소 클론

```bash
git clone <repository-url>
cd email_auto_sender
```

#### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 설정값을 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 예시:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SMTP Configuration (Gmail 예시)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Default Sender Information
DEFAULT_SENDER_NAME=Your Company
DEFAULT_SENDER_EMAIL=your-email@gmail.com

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

##### Gmail 사용 시 설정 방법

1. Google 계정의 2단계 인증 활성화
2. [앱 비밀번호 생성](https://myaccount.google.com/apppasswords)
3. 생성된 16자리 비밀번호를 `SMTP_PASS`에 입력

#### 3. 백엔드 설치 및 실행

```bash
cd backend
npm install
npm start
# 또는 개발 모드: npm run dev
```

서버가 `http://localhost:5000`에서 실행됩니다.

#### 4. 프론트엔드 설치 및 실행

새 터미널에서:

```bash
cd frontend
npm install
npm start
```

브라우저가 자동으로 `http://localhost:3000`을 엽니다.

## 📖 사용 방법

### 1. 발신자 설정

1. **발신자 관리** 탭으로 이동
2. **발신자 추가** 버튼 클릭
3. 이름과 이메일 주소 입력
4. 기본 발신자로 설정 (선택사항)

### 2. 수신자 목록 준비

#### Excel 파일 형식 (.xlsx, .xls)

| Email | Name | Company | Position |
|-------|------|---------|----------|
| john@example.com | John Doe | ABC Inc | Manager |
| jane@example.com | Jane Smith | XYZ Corp | Director |

**필수 컬럼**: `Email` (또는 `email`, `이메일`)
**선택 컬럼**: `Name` (또는 `name`, `이름`), 기타 변수

#### XML 파일 형식

```xml
<?xml version="1.0" encoding="UTF-8"?>
<recipients>
  <recipient>
    <email>john@example.com</email>
    <name>John Doe</name>
    <company>ABC Inc</company>
    <position>Manager</position>
  </recipient>
  <recipient>
    <email>jane@example.com</email>
    <name>Jane Smith</name>
    <company>XYZ Corp</company>
    <position>Director</position>
  </recipient>
</recipients>
```

### 3. 수신자 업로드

1. **수신자 관리** 탭으로 이동
2. **파일 선택** 버튼 클릭
3. Excel 또는 XML 파일 선택
4. 미리보기 확인
5. **업로드** 버튼 클릭

### 4. 이메일 작성 및 발송

1. **이메일 작성** 탭으로 이동
2. 발신자 선택
3. 수신자 그룹 선택
4. 제목 입력 (변수 사용 가능: `안녕하세요 {{name}}님`)
5. 본문 작성:
   - 텍스트 포맷팅
   - 이미지 삽입 (이미지 아이콘 클릭)
   - 템플릿 변수 삽입 (`{{변수명}}`)
6. **미리보기** 버튼으로 확인
7. **이메일 발송** 버튼 클릭

### 5. 템플릿 저장 및 재사용

1. 이메일 작성 후 **템플릿 저장** 버튼 클릭
2. 템플릿 이름 입력
3. **템플릿 관리** 탭에서 저장된 템플릿 확인
4. **불러오기** 버튼으로 템플릿 재사용

## 🎨 템플릿 변수 사용법

템플릿 변수는 `{{변수명}}` 형식으로 사용합니다.

### 기본 변수

- `{{name}}`: 수신자 이름
- `{{email}}`: 수신자 이메일

### 커스텀 변수

Excel/XML 파일의 컬럼명이 자동으로 변수가 됩니다.

**예시**:

Excel 파일에 `Company`, `Position` 컬럼이 있다면:

```
안녕하세요 {{name}}님,

{{company}}의 {{position}}로 계신다는 소식을 들었습니다.
```

각 수신자마다 자동으로 개인화된 내용이 생성됩니다.

## 🔧 API 엔드포인트

### 이메일 API

- `POST /api/email/send` - 단일 이메일 발송
- `POST /api/email/send-bulk` - 일괄 이메일 발송
- `POST /api/email/preview` - 이메일 미리보기
- `POST /api/email/test` - 테스트 이메일 발송
- `GET /api/email/test-connection` - SMTP 연결 테스트

### 템플릿 API

- `GET /api/templates` - 모든 템플릿 조회
- `GET /api/templates/:id` - 특정 템플릿 조회
- `POST /api/templates` - 템플릿 생성
- `PUT /api/templates/:id` - 템플릿 업데이트
- `DELETE /api/templates/:id` - 템플릿 삭제

### 수신자 API

- `GET /api/recipients` - 모든 수신자 그룹 조회
- `POST /api/recipients` - 수신자 그룹 생성
- `POST /api/recipients/upload` - 파일 업로드
- `POST /api/recipients/parse` - 파일 미리보기
- `DELETE /api/recipients/:id` - 수신자 그룹 삭제

### 발신자 API

- `GET /api/senders` - 모든 발신자 조회
- `POST /api/senders` - 발신자 생성
- `PUT /api/senders/:id` - 발신자 업데이트
- `DELETE /api/senders/:id` - 발신자 삭제

## 🛠️ 기술 스택

### 백엔드

- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **nodemailer** - 이메일 발송
- **Handlebars** - 템플릿 엔진
- **xlsx** - Excel 파일 파싱
- **fast-xml-parser** - XML 파일 파싱
- **multer** - 파일 업로드

### 프론트엔드

- **React** - UI 라이브러리
- **React Quill** - 리치 텍스트 에디터
- **Axios** - HTTP 클라이언트

## ⚠️ 주의사항

1. **SMTP 설정**: 반드시 올바른 SMTP 정보를 입력해야 합니다.
2. **발송 제한**: 이메일 서비스 제공자의 발송 제한을 확인하세요.
   - Gmail: 하루 500통 제한
   - 대량 발송 시 SendGrid, Mailgun 등 사용 권장
3. **스팸 방지**: 발송 간 적절한 딜레이를 설정하세요.
4. **개인정보 보호**: 수신자 정보를 안전하게 관리하세요.

## 🐛 문제 해결

### SMTP 연결 실패

- SMTP 호스트, 포트, 인증 정보 확인
- 방화벽 설정 확인
- Gmail의 경우 앱 비밀번호 사용 확인

### 파일 업로드 실패

- 파일 형식 확인 (.xlsx, .xls, .xml만 지원)
- 파일에 Email 컬럼이 있는지 확인
- 파일 크기 확인 (최대 10MB)

### 이메일 발송 실패

- SMTP 연결 상태 확인 (상단 연결 상태 표시)
- 발신자 이메일 인증 확인
- 수신자 이메일 형식 확인

## 📝 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
