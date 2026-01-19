import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { uploadAPI } from '../services/api';

// Dynamic import to avoid SSR issues
const ReactQuill = React.lazy(() => import('react-quill'));

const EmailEditor = ({ subject, setSubject, content, setContent }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);
  const quillRef = useRef(null);

  // Load Quill CSS dynamically
  useEffect(() => {
    import('react-quill/dist/quill.snow.css').then(() => {
      setIsQuillLoaded(true);
    });
  }, []);

  // 이미지 업로드 핸들러
  const imageHandler = useMemo(() => {
    return function() {
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

          // Quill 에디터에 이미지 삽입
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        } catch (error) {
          console.error('Image upload error:', error);
          setUploadError('이미지 업로드에 실패했습니다.');
        } finally {
          setUploading(false);
        }
      };
    };
  }, []);

  // Quill 에디터 모듈 설정 - useMemo로 안정화
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

  const formats = useMemo(() => [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'list',
    'bullet',
    'indent',
    'direction',
    'align',
    'link',
    'image',
    'video',
  ], []);

  if (!isQuillLoaded) {
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
          <Form.Label>내용</Form.Label>
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
            <p className="mt-2 text-muted">에디터 로딩 중...</p>
          </div>
        </Form.Group>
      </div>
    );
  }

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
        <Form.Label>내용</Form.Label>
        {uploadError && <Alert variant="danger">{uploadError}</Alert>}
        {uploading && <Alert variant="info">이미지 업로드 중...</Alert>}
        <div style={{ marginBottom: '50px' }}>
          <React.Suspense fallback={<div>에디터 로딩 중...</div>}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
            />
          </React.Suspense>
        </div>
        <Form.Text className="text-muted">
          이미지를 삽입하려면 툴바의 이미지 아이콘을 클릭하세요.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default EmailEditor;
