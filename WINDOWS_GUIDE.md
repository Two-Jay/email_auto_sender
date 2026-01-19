# Windows 사용자 가이드

Email Auto Sender를 Windows에서 실행하는 방법입니다.

## 준비사항

다음 프로그램들이 설치되어 있어야 합니다:

1. **Python 3.9 이상**
   - [다운로드](https://www.python.org/downloads/)
   - 설치시 "Add Python to PATH" 옵션 체크 필수!

2. **Node.js 16 이상**
   - [다운로드](https://nodejs.org/)
   - LTS 버전 권장

3. **Git** (선택사항)
   - [다운로드](https://git-scm.com/download/win)
   - 저장소를 클론하려면 필요

## 설치 방법

### 1단계: 프로젝트 다운로드

**Git 사용:**
```cmd
git clone https://github.com/Two-Jay/email_auto_sender.git
cd email_auto_sender
```

**또는 ZIP 다운로드:**
- GitHub에서 "Code" → "Download ZIP" 클릭
- 압축 해제 후 폴더로 이동

### 2단계: 자동 설치 실행

`setup.bat` 파일을 더블클릭하거나, CMD에서 실행:

```cmd
setup.bat
```

설치가 완료되면 다음과 같은 메시지가 표시됩니다:
```
================================
설치가 완료되었습니다!
================================
```

### 3단계: 메일 계정 설정

프로젝트 폴더의 `.env` 파일을 메모장으로 열어 수정:

**Naver 메일 사용 예시:**
```
NAVER_EMAIL=your-email@naver.com
NAVER_PASSWORD=your-password
```

**Google 메일 사용 예시:**
```
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=your-16-digit-app-password
```

> ⚠️ **중요**: Google은 일반 비밀번호가 아닌 "앱 비밀번호"를 사용해야 합니다!

## 실행 방법

### 방법 1: 개발 모드 (권장)

`dev.bat` 파일을 더블클릭하거나:

```cmd
dev.bat
```

두 개의 콘솔 창이 열립니다:
- 하나는 백엔드 (Python 서버)
- 하나는 프론트엔드 (React 개발 서버)

잠시 기다리면 브라우저가 자동으로 열립니다.

**장점:**
- 코드 변경시 자동 새로고침
- 개발에 편리

### 방법 2: 프로덕션 모드

`start.bat` 파일을 더블클릭하거나:

```cmd
start.bat
```

**장점:**
- 빌드된 버전 실행
- 더 안정적

## 종료 방법

### 개발 모드 종료
- 각 콘솔 창에서 `Ctrl + C` 누르기
- 또는 콘솔 창 닫기

### 프로덕션 모드 종료
`stop.bat` 파일을 더블클릭하거나:

```cmd
stop.bat
```

## 접속 주소

프로그램이 실행되면 다음 주소로 접속:

- **웹 애플리케이션**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs
- **백엔드**: http://localhost:8000

## 문제 해결

### Python을 찾을 수 없습니다

**문제:**
```
'python'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램...
```

**해결:**
1. Python이 설치되어 있는지 확인
2. 명령 프롬프트를 새로 열기
3. `python --version` 명령으로 확인
4. 여전히 안되면 Python 재설치 (PATH 옵션 체크)

### Node를 찾을 수 없습니다

**문제:**
```
'node'은(는) 내부 또는 외는 명령...
```

**해결:**
1. Node.js가 설치되어 있는지 확인
2. 명령 프롬프트를 새로 열기
3. `node --version` 명령으로 확인
4. 여전히 안되면 Node.js 재설치

### 포트가 이미 사용 중입니다

**문제:**
```
Error: Address already in use
```

**해결:**
1. 다른 프로그램이 같은 포트(3000, 8000)를 사용 중
2. 다른 프로그램 종료
3. 또는 `.env` 파일에서 포트 변경:
   ```
   BACKEND_PORT=8001
   FRONTEND_PORT=3001
   ```

### 메일 발송이 실패합니다

**Google 메일:**
- 앱 비밀번호 사용 확인
- 2단계 인증이 활성화되어 있는지 확인
- 앱 비밀번호는 16자리여야 함 (공백 제외)

**Naver 메일:**
- 이메일 주소와 비밀번호 확인
- SMTP 설정이 정확한지 확인

### 엑셀 파일 업로드 오류

**문제:**
```
엑셀 파일 처리 중 오류 발생
```

**해결:**
1. 파일 형식이 `.xlsx` 또는 `.xls`인지 확인
2. `email` 열이 있는지 확인
3. 파일이 열려있지 않은지 확인 (닫기)

## Google 앱 비밀번호 만들기

1. https://myaccount.google.com/ 접속
2. 왼쪽 메뉴에서 "보안" 클릭
3. "Google에 로그인" 섹션에서 "2단계 인증" 활성화
4. "2단계 인증" 페이지 맨 아래 "앱 비밀번호" 클릭
5. 앱 선택: "메일", 기기 선택: "Windows 컴퓨터"
6. "생성" 클릭
7. 표시되는 16자리 비밀번호를 복사
8. `.env` 파일의 `GOOGLE_APP_PASSWORD`에 붙여넣기 (공백 제외)

## 팁

### 빠른 재시작
프로그램 수정 후:
1. `Ctrl + C`로 종료
2. 다시 `dev.bat` 실행

### 로그 확인
문제 발생시:
- 백엔드 로그: 백엔드 콘솔 창 확인
- 프론트엔드 로그: 프론트엔드 콘솔 창 확인

### 캐시 삭제
가끔 문제가 발생하면:
```cmd
cd frontend
rmdir /s /q node_modules
npm install
```

## 추가 도움말

문제가 계속 발생하면:
1. README.md 파일 참고
2. CLAUDE.md 파일의 문제 해결 섹션 참고
3. GitHub 이슈 등록: https://github.com/Two-Jay/email_auto_sender/issues
