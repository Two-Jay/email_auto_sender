import React, { useState } from 'react';
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
import { FaPaperPlane, FaEye } from 'react-icons/fa';
import { emailAPI } from '../services/api';

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
        attachments: [],
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
