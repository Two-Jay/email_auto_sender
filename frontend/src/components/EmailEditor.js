import React, { useState, useRef, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// 이미지 리사이즈 모듈 (옵션)
// import ImageResize from 'quill-image-resize-module-react';
// Quill.register('modules/imageResize', ImageResize);

const EmailEditor = ({ value, onChange, placeholder }) => {
  const quillRef = useRef(null);

  // 이미지 핸들러 - Base64로 변환하여 삽입
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', e.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  };

  // Quill 모듈 설정
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  // Quill 포맷 설정
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ];

  return (
    <div className="email-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || '이메일 본문을 작성하세요...'}
        style={{ height: '400px', marginBottom: '50px' }}
      />
    </div>
  );
};

export default EmailEditor;
