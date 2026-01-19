import React, { useRef } from 'react';
import { Form } from 'react-bootstrap';
import { Editor } from '@tinymce/tinymce-react';
import { uploadAPI } from '../services/api';

const EmailEditor = ({ subject, setSubject, content, setContent }) => {
  const editorRef = useRef(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = (blobInfo, progress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const file = blobInfo.blob();
        const response = await uploadAPI.uploadImage(file);
        const imageUrl = `http://localhost:8000${response.data.url}`;
        resolve(imageUrl);
      } catch (error) {
        console.error('Image upload error:', error);
        reject('이미지 업로드에 실패했습니다.');
      }
    });
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
        <Form.Label>내용</Form.Label>
        <Editor
          apiKey="no-api-key"
          onInit={(evt, editor) => (editorRef.current = editor)}
          value={content}
          onEditorChange={(newContent) => setContent(newContent)}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | image link | code | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',

            // 이미지 관련 설정
            images_upload_handler: handleImageUpload,
            automatic_uploads: true,
            images_reuse_filename: true,
            image_advtab: true,
            image_title: true,
            image_description: true,
            image_dimensions: true,

            // 이미지 드래그로 크기 조절 가능
            object_resizing: true,

            // 한글 지원
            language: 'ko_KR',
            language_url: 'https://cdn.jsdelivr.net/npm/tinymce-lang/langs/ko_KR.js',

            // 파일 선택기 타입
            file_picker_types: 'image',

            // 기본 링크 동작
            link_default_target: '_blank',
            link_assume_external_targets: true,

            // 드래그 앤 드롭 이미지 업로드
            paste_data_images: true,

            // 코드 보기 설정
            code_dialog_height: 450,
            code_dialog_width: 1000,

            // 유효하지 않은 요소 허용 (변수 템플릿용)
            valid_elements: '*[*]',
            extended_valid_elements: '*[*]',

            // 기타 설정
            branding: false,
            promotion: false,
          }}
        />
        <Form.Text className="text-muted">
          리치 텍스트 에디터입니다. 이미지를 드래그하여 크기를 조절하거나, "코드" 버튼을 눌러 HTML을 직접 편집할 수 있습니다.
          변수는 {`{{변수명}}`} 형식으로 입력합니다.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default EmailEditor;
