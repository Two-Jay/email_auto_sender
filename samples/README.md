# 샘플 파일

이 디렉토리에는 이메일 자동 발신 시스템을 테스트하기 위한 샘플 파일이 포함되어 있습니다.

## 파일 목록

### recipients_sample.xml
XML 형식의 수신자 목록 샘플 파일입니다.

**사용 방법**:
1. 웹 앱의 "수신자 관리" 탭으로 이동
2. "파일 선택" 버튼 클릭
3. `recipients_sample.xml` 파일 선택
4. 미리보기 확인 후 업로드

## Excel 샘플 파일 만들기

Excel 파일은 다음 형식으로 작성하세요:

| Email | Name | Company | Position |
|-------|------|---------|----------|
| john.doe@example.com | John Doe | ABC Corporation | Manager |
| jane.smith@example.com | Jane Smith | XYZ Industries | Director |
| bob.johnson@example.com | Bob Johnson | Tech Solutions | CTO |

**필수 컬럼**: Email (또는 email, 이메일)
**선택 컬럼**: Name, 기타 원하는 변수명

파일을 `.xlsx` 또는 `.xls` 형식으로 저장한 후 업로드하세요.

## 템플릿 변수 사용 예시

위 샘플 파일을 사용하면 다음 변수를 이메일 템플릿에서 사용할 수 있습니다:

- `{{name}}` - 수신자 이름
- `{{email}}` - 수신자 이메일
- `{{company}}` - 회사명
- `{{position}}` - 직책

**이메일 예시**:

```
제목: {{company}} {{name}}님께 드리는 특별한 제안

본문:
안녕하세요 {{name}}님,

{{company}}의 {{position}}로 계신다는 소식을 들었습니다.
저희는 귀사에 특별한 제안을 드리고자 합니다.

...
```
