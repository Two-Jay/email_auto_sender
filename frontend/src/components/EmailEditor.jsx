import React, { useState, useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Form, Alert } from 'react-bootstrap';
import { uploadAPI } from '../services/api';

const EmailEditor = ({ subject, setSubject, content, setContent }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const quillRef = useRef(null);

  // 이미지 업로드 핸들러
  const imageHandler = useCallback(() => {
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
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection() || { index: 0 };
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        }
      } catch (error) {
        console.error('Image upload error:', error);
        setUploadError('이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    };
  }, []);

  // Quill 에디터 모듈 설정
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

  const formats = [
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
  ];

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
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
          />
        </div>
        <Form.Text className="text-muted">
          이미지를 삽입하려면 툴바의 이미지 아이콘을 클릭하세요.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default EmailEditor;
