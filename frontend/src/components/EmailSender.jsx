import React, { useState, useRef } from 'react';
import {
  Form,
  Button,
  Alert,
  Card,
  ProgressBar,
  ListGroup,
  Badge,
  Modal,
} from 'react-bootstrap';
import { FaPaperPlane, FaEye, FaPaperclip, FaTrash, FaFile } from 'react-icons/fa';
import { emailAPI, uploadAPI } from '../services/api';

const EmailSender = ({ subject, content, recipients }) => {
  const [senderConfig, setSenderConfig] = useState({
    provider: 'naver',
    email: '',
    password: '',
    name: '',
  });
  const [cc, setCc] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);

  // 첨부파일 크기 포맷
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 첨부파일 업로드
  const handleAttachmentUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachment(true);
    setError('');

    try {
      for (const file of files) {
        const response = await uploadAPI.uploadAttachment(file);
        if (response.data.success) {
          setAttachments(prev => [...prev, {
            filename: response.data.filename,
            originalName: response.data.original_name,
            path: response.data.path,
            size: response.data.size
          }]);
        }
      }
    } catch (error) {
      console.error('Attachment upload error:', error);
      setError(error.response?.data?.detail || '첨부파일 업로드에 실패했습니다.');
    } finally {
      setUploadingAttachment(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 첨부파일 삭제
  const handleAttachmentDelete = async (filename) => {
    try {
      await uploadAPI.deleteAttachment(filename);
      setAttachments(prev => prev.filter(a => a.filename !== filename));
    } catch (error) {
      console.error('Attachment delete error:', error);
      setError('첨부파일 삭제에 실패했습니다.');
    }
  };

  // 미리보기
  const handlePreview = async () => {
    if (!recipients || recipients.length === 0) {
      setError('수신자가 없습니다.');
      return;
    }

    setError('');

    try {
      const previewRequest = {
        sender: senderConfig,
        recipient: {
          email: recipients[0].email,
          variables: recipients[0].variables || {},
        },
        template: {
          subject: subject,
          html_content: content,
        },
        cc: cc.split(',').filter((c) => c.trim()),
      };

      const response = await emailAPI.preview(previewRequest);
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      setError('미리보기 생성에 실패했습니다.');
    }
  };

  // 메일 발송
  const handleSend = async () => {
    if (!senderConfig.email || !senderConfig.password) {
      setError('발신자 정보를 입력해주세요.');
      return;
    }

    if (!subject || !content) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    if (!recipients || recipients.length === 0) {
      setError('수신자가 없습니다.');
      return;
    }

    if (!window.confirm(`${recipients.length}명에게 메일을 발송하시겠습니까?`)) {
      return;
    }

    setSending(true);
    setError('');
    setResult(null);

    try {
      const ccList = cc
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c);

      const requestData = {
        sender: senderConfig,
        recipients: recipients.map((r) => ({
          email: r.email,
          variables: r.variables || {},
        })),
        template: {
          subject: subject,
          html_content: content,
        },
        cc: ccList,
        attachments: attachments.map(a => a.path),
      };

      const response = await emailAPI.sendBulk(requestData);
      setResult(response.data);
    } catch (error) {
      console.error('Send error:', error);
      setError(
        error.response?.data?.detail || '메일 발송에 실패했습니다.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <h5>발신자 설정</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>메일 서비스</Form.Label>
              <Form.Select
                value={senderConfig.provider}
                onChange={(e) =>
                  setSenderConfig({ ...senderConfig, provider: e.target.value })
                }
              >
                <option value="naver">Naver</option>
                <option value="google">Google</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {senderConfig.provider === 'google' &&
                  'Google의 경우 "앱 비밀번호"를 사용하세요.'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>발신자 이메일</Form.Label>
              <Form.Control
                type="email"
                value={senderConfig.email}
                onChange={(e) =>
                  setSenderConfig({ ...senderConfig, email: e.target.value })
                }
                placeholder={
                  senderConfig.provider === 'naver'
                    ? 'your-email@naver.com'
                    : 'your-email@gmail.com'
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control
                type="password"
                value={senderConfig.password}
                onChange={(e) =>
                  setSenderConfig({ ...senderConfig, password: e.target.value })
                }
                placeholder="비밀번호 또는 앱 비밀번호"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>발신자 이름 (선택)</Form.Label>
              <Form.Control
                type="text"
                value={senderConfig.name}
                onChange={(e) =>
                  setSenderConfig({ ...senderConfig, name: e.target.value })
                }
                placeholder="홍길동"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>참조 (CC)</Form.Label>
              <Form.Control
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc1@example.com, cc2@example.com"
              />
              <Form.Text className="text-muted">
                여러 개의 이메일은 쉼표(,)로 구분하세요.
              </Form.Text>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          <h5><FaPaperclip /> 첨부파일</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>파일 선택</Form.Label>
            <Form.Control
              type="file"
              ref={fileInputRef}
              onChange={handleAttachmentUpload}
              multiple
              disabled={uploadingAttachment}
            />
            <Form.Text className="text-muted">
              지원 형식: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR, 7Z, 이미지 파일 (최대 10MB)
            </Form.Text>
          </Form.Group>

          {uploadingAttachment && (
            <ProgressBar animated now={100} label="업로드 중..." className="mb-3" />
          )}

          {attachments.length > 0 && (
            <ListGroup>
              {attachments.map((attachment, index) => (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <FaFile className="me-2" />
                    <span>{attachment.originalName}</span>
                    <Badge bg="secondary" className="ms-2">
                      {formatFileSize(attachment.size)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleAttachmentDelete(attachment.filename)}
                  >
                    <FaTrash />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

          {attachments.length === 0 && !uploadingAttachment && (
            <p className="text-muted mb-0">첨부된 파일이 없습니다.</p>
          )}
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert variant={result.success ? 'success' : 'warning'}>
          <h6>{result.message}</h6>
          <p className="mb-0">
            성공: {result.total_sent} / 실패: {result.total_failed}
          </p>
          {result.failed_recipients && result.failed_recipients.length > 0 && (
            <div className="mt-2">
              <strong>실패한 수신자:</strong>
              <ul className="mb-0">
                {result.failed_recipients.map((item, index) => (
                  <li key={index}>
                    {typeof item === 'string' ? (
                      item
                    ) : (
                      <>
                        {item.email}
                        <span className="text-muted ms-2">- {item.reason}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Alert>
      )}

      <div className="d-flex gap-2">
        <Button
          variant="outline-primary"
          onClick={handlePreview}
          disabled={sending || !recipients || recipients.length === 0}
        >
          <FaEye /> 미리보기
        </Button>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={sending || !recipients || recipients.length === 0}
        >
          <FaPaperPlane /> {sending ? '발송 중...' : `메일 발송 (${recipients?.length || 0}명)`}
        </Button>
      </div>

      {sending && (
        <div className="mt-3">
          <ProgressBar animated now={100} label="발송 중..." />
        </div>
      )}

      {/* 미리보기 모달 */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>메일 미리보기</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData && (
            <div>
              <p>
                <strong>수신자:</strong> {previewData.recipient}
              </p>
              <p>
                <strong>제목:</strong> {previewData.subject}
              </p>
              {previewData.cc && previewData.cc.length > 0 && (
                <p>
                  <strong>참조 (CC):</strong> {previewData.cc.join(', ')}
                </p>
              )}
              {attachments.length > 0 && (
                <p>
                  <strong>첨부파일:</strong> {attachments.map(a => a.originalName).join(', ')}
                </p>
              )}
              <hr />
              <div
                dangerouslySetInnerHTML={{ __html: previewData.html_content }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmailSender;
