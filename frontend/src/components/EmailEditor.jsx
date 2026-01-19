import React, { useState, useRef } from 'react';
import { Form, Button, Alert, ButtonGroup } from 'react-bootstrap';
import { uploadAPI } from '../services/api';

const EmailEditor = ({ subject, setSubject, content, setContent }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const textareaRef = useRef(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      setUploading(true);
      setUploadError('');

      try {
        const response = await uploadAPI.uploadImage(file);
        const imageUrl = `http://localhost:8000${response.data.url}`;

        // textarea에 이미지 태그 삽입
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imageTag = `<img src="${imageUrl}" alt="이미지" style="max-width: 100%; height: auto;" />`;

        const newContent = content.substring(0, start) + imageTag + content.substring(end);
        setContent(newContent);

        // 커서 위치 조정
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageTag.length;
          textarea.focus();
        }, 0);
      } catch (error) {
        console.error('Image upload error:', error);
        setUploadError('이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    };
  };

  // HTML 태그 삽입 헬퍼
  const insertTag = (tagName, closeTag = true) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText;
    if (closeTag) {
      newText = `<${tagName}>${selectedText}</${tagName}>`;
    } else {
      newText = `<${tagName}>`;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // 커서 위치 조정
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + newText.length;
      } else {
        const cursorPos = start + tagName.length + 2; // <tagName> 이후
        textarea.selectionStart = textarea.selectionEnd = cursorPos;
      }
      textarea.focus();
    }, 0);
  };

  // 링크 삽입
  const insertLink = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const url = prompt('링크 URL을 입력하세요:', 'https://');
    if (!url) return;

    const linkText = selectedText || '링크 텍스트';
    const linkTag = `<a href="${url}">${linkText}</a>`;

    const newContent = content.substring(0, start) + linkTag + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + linkTag.length;
      textarea.focus();
    }, 0);
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>제목</Form.Label>
        <Form.Control
          type="text"
          placeholder="이메일 제목 (변수 사용: {{이름}})"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Form.Text className="text-muted">
          변수를 사용하려면 {`{{변수명}}`} 형식으로 입력하세요. 예: {`{{이름}}님께 드리는 안내`}
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>내용 (HTML)</Form.Label>
        {uploadError && <Alert variant="danger" dismissible onClose={() => setUploadError('')}>{uploadError}</Alert>}
        {uploading && <Alert variant="info">이미지 업로드 중...</Alert>}

        {/* HTML 편집 도구 */}
        <div className="mb-2">
          <ButtonGroup size="sm" className="me-2 mb-2">
            <Button variant="outline-secondary" onClick={() => insertTag('b')} title="굵게">
              <strong>B</strong>
            </Button>
            <Button variant="outline-secondary" onClick={() => insertTag('i')} title="이탤릭">
              <em>I</em>
            </Button>
            <Button variant="outline-secondary" onClick={() => insertTag('u')} title="밑줄">
              <u>U</u>
            </Button>
            <Button variant="outline-secondary" onClick={() => insertTag('s')} title="취소선">
              <s>S</s>
            </Button>
          </ButtonGroup>

          <ButtonGroup size="sm" className="me-2 mb-2">
            <Button variant="outline-secondary" onClick={() => insertTag('h1')} title="제목 1">
              H1
            </Button>
            <Button variant="outline-secondary" onClick={() => insertTag('h2')} title="제목 2">
              H2
            </Button>
            <Button variant="outline-secondary" onClick={() => insertTag('h3')} title="제목 3">
              H3
            </Button>
          </ButtonGroup>

          <ButtonGroup size="sm" className="me-2 mb-2">
            <Button variant="outline-secondary" onClick={() => insertTag('p')} title="문단">
              P
            </Button>
            <Button variant="outline-secondary" onClick={() => insertTag('br', false)} title="줄바꿈">
              BR
            </Button>
            <Button variant="outline-secondary" onClick={insertLink} title="링크">
              Link
            </Button>
          </ButtonGroup>

          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleImageUpload}
            disabled={uploading}
            className="mb-2"
          >
            📷 이미지 업로드
          </Button>
        </div>

        <Form.Control
          as="textarea"
          ref={textareaRef}
          rows={15}
          placeholder="HTML 코드를 입력하세요. 예: <p>안녕하세요, {{이름}}님!</p>"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        />
        <Form.Text className="text-muted">
          HTML 태그를 직접 작성하거나 위의 버튼을 사용하세요.
          변수는 {`{{변수명}}`} 형식으로 입력합니다.
          이미지를 삽입하려면 "이미지 업로드" 버튼을 클릭하세요.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default EmailEditor;
