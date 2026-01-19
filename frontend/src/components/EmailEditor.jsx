import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Form, Alert, Tab, Tabs } from 'react-bootstrap';
import { uploadAPI } from '../services/api';

// TinyMCE 셀프 호스팅을 위한 import
import 'tinymce/tinymce';
import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';

// 필요한 플러그인 import
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/help';
import 'tinymce/plugins/wordcount';

// TinyMCE 스킨 CSS
import 'tinymce/skins/ui/oxide/skin.min.css';

// TinyMCE 라이센스 키 설정
// 환경 변수에 API 키가 있으면 사용, 없으면 GPL 셀프호스트 모드
const TINYMCE_LICENSE_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'gpl';

const EmailEditor = ({ subject, setSubject, content, setContent }) => {
  const editorRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('visual');
  const [htmlContent, setHtmlContent] = useState(content);

  // 탭 전환 핸들러
  const handleTabChange = (tab) => {
    if (tab === 'html' && editorRef.current) {
      // WYSIWYG -> HTML: 에디터 내용을 HTML로 가져오기
      setHtmlContent(editorRef.current.getContent());
    } else if (tab === 'visual' && editorRef.current) {
      // HTML -> WYSIWYG: HTML 내용을 에디터에 설정
      editorRef.current.setContent(htmlContent);
      setContent(htmlContent);
    }
    setActiveTab(tab);
  };

  // HTML 직접 편집 핸들러
  const handleHtmlChange = (e) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    setContent(newHtml);
  };

  // 이미지 업로드 핸들러 (TinyMCE용)
  const imageUploadHandler = async (blobInfo) => {
    setUploading(true);
    setUploadError('');

    try {
      const file = blobInfo.blob();
      const response = await uploadAPI.uploadImage(file);
      const imageUrl = `http://localhost:8000${response.data.url}`;
      return imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError('이미지 업로드에 실패했습니다.');
      throw new Error('이미지 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  // 에디터 내용 변경 핸들러
  const handleEditorChange = (newContent) => {
    setContent(newContent);
    setHtmlContent(newContent);
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
        {uploadError && (
          <Alert variant="danger" dismissible onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        )}
        {uploading && <Alert variant="info">이미지 업로드 중...</Alert>}

        <Tabs
          activeKey={activeTab}
          onSelect={handleTabChange}
          className="mb-2"
        >
          <Tab eventKey="visual" title="비주얼 편집기">
            <div style={{ border: '1px solid #ced4da', borderRadius: '0.375rem' }}>
              <Editor
                onInit={(evt, editor) => {
                  editorRef.current = editor;
                }}
                value={content}
                onEditorChange={handleEditorChange}
                licenseKey={TINYMCE_LICENSE_KEY}
                init={{
                  height: 400,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'help', 'wordcount'
                  ],
                  toolbar:
                    'undo redo | blocks | ' +
                    'bold italic forecolor backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'image link media | table | code | removeformat | help',

                  // 이미지 설정
                  images_upload_handler: imageUploadHandler,
                  automatic_uploads: true,
                  images_reuse_filename: true,
                  image_advtab: true,
                  image_caption: true,

                  // 이미지 드래그 & 리사이즈 설정
                  object_resizing: true,
                  resize_img_proportional: true,

                  // 한국어 설정
                  language: 'ko_KR',
                  language_url: '',  // 한국어 팩 없으면 영어 사용

                  // 컨텐츠 스타일
                  content_style: `
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      font-size: 14px;
                      line-height: 1.6;
                      padding: 10px;
                    }
                    img {
                      max-width: 100%;
                      height: auto;
                      cursor: move;
                    }
                    img.mce-selected {
                      outline: 2px solid #007bff;
                    }
                  `,

                  // 드래그 앤 드롭으로 이미지 이동 허용
                  paste_data_images: true,

                  // 스킨 설정 (셀프 호스팅)
                  skin: false,
                  content_css: false,

                  // 기본 설정
                  branding: false,
                  promotion: false,
                  elementpath: false,

                  // 테이블 설정
                  table_responsive_width: true,
                  table_default_styles: {
                    width: '100%',
                    borderCollapse: 'collapse'
                  },

                  // 링크 설정
                  link_default_target: '_blank',

                  // 포맷 설정
                  formats: {
                    alignleft: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'left' },
                    aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'center', styles: { textAlign: 'center', marginLeft: 'auto', marginRight: 'auto', display: 'block' } },
                    alignright: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'right' },
                  },

                  // 초기화 후 설정
                  setup: (editor) => {
                    editor.on('init', () => {
                      // 초기 컨텐츠 설정
                      if (content) {
                        editor.setContent(content);
                      }
                    });
                  }
                }}
              />
            </div>
          </Tab>

          <Tab eventKey="html" title="HTML 소스">
            <Form.Control
              as="textarea"
              rows={15}
              placeholder="HTML 코드를 직접 입력하세요. 예: <p>안녕하세요, {{이름}}님!</p>"
              value={htmlContent}
              onChange={handleHtmlChange}
              style={{
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem'
              }}
            />
          </Tab>
        </Tabs>

        <Form.Text className="text-muted">
          <strong>비주얼 편집기:</strong> 이미지를 드래그하여 위치를 변경하고, 모서리를 드래그하여 크기를 조절할 수 있습니다.<br/>
          <strong>HTML 소스:</strong> HTML 코드를 직접 편집할 수 있습니다.<br/>
          변수는 {`{{변수명}}`} 형식으로 입력합니다.
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default EmailEditor;
