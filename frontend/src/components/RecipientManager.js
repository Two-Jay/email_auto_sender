import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Modal,
  Alert,
  Badge,
  Spinner,
} from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUpload } from 'react-icons/fa';
import { recipientAPI, uploadAPI } from '../services/api';

const RecipientManager = ({ onRecipientsChange }) => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    variables: {},
  });

  // 수신자 목록 로드
  const loadRecipients = async () => {
    setLoading(true);
    try {
      const response = await recipientAPI.getAll();
      setRecipients(response.data);
      if (onRecipientsChange) {
        onRecipientsChange(response.data);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      setError('수신자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  // 수신자 추가/수정 모달 열기
  const handleShowModal = (recipient = null) => {
    if (recipient) {
      setEditingRecipient(recipient);
      setFormData({
        email: recipient.email,
        variables: recipient.variables || {},
      });
    } else {
      setEditingRecipient(null);
      setFormData({
        email: '',
        variables: {},
      });
    }
    setShowModal(true);
  };

  // 수신자 추가/수정
  const handleSave = async () => {
    try {
      if (editingRecipient) {
        await recipientAPI.update(editingRecipient.id, formData);
      } else {
        await recipientAPI.create(formData);
      }
      setShowModal(false);
      loadRecipients();
    } catch (error) {
      console.error('Error saving recipient:', error);
      setError('수신자 저장에 실패했습니다.');
    }
  };

  // 수신자 삭제
  const handleDelete = async (id) => {
    if (window.confirm('이 수신자를 삭제하시겠습니까?')) {
      try {
        await recipientAPI.delete(id);
        loadRecipients();
      } catch (error) {
        console.error('Error deleting recipient:', error);
        setError('수신자 삭제에 실패했습니다.');
      }
    }
  };

  // 엑셀 업로드
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const response = await uploadAPI.uploadExcel(file);
      const parsedRecipients = response.data.recipients;

      // 대량 추가
      await recipientAPI.createBulk(parsedRecipients);
      loadRecipients();
      alert(`${parsedRecipients.length}명의 수신자가 추가되었습니다.`);
    } catch (error) {
      console.error('Error uploading excel:', error);
      setError('엑셀 파일 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // 변수 추가
  const handleAddVariable = () => {
    const varName = prompt('변수명을 입력하세요:');
    if (varName && varName.trim()) {
      setFormData({
        ...formData,
        variables: {
          ...formData.variables,
          [varName.trim()]: '',
        },
      });
    }
  };

  // 변수 값 변경
  const handleVariableChange = (key, value) => {
    setFormData({
      ...formData,
      variables: {
        ...formData.variables,
        [key]: value,
      },
    });
  };

  // 변수 삭제
  const handleRemoveVariable = (key) => {
    const newVariables = { ...formData.variables };
    delete newVariables[key];
    setFormData({
      ...formData,
      variables: newVariables,
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>
          수신자 관리 <Badge bg="secondary">{recipients.length}</Badge>
        </h4>
        <div>
          <Button variant="primary" size="sm" onClick={() => handleShowModal()} className="me-2">
            <FaPlus /> 수신자 추가
          </Button>
          <Button variant="success" size="sm" as="label" htmlFor="excel-upload">
            <FaUpload /> 엑셀 업로드
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              style={{ display: 'none' }}
            />
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>이메일</th>
              <th>변수</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-muted">
                  등록된 수신자가 없습니다
                </td>
              </tr>
            ) : (
              recipients.map((recipient, index) => (
                <tr key={recipient.id}>
                  <td>{index + 1}</td>
                  <td>{recipient.email}</td>
                  <td>
                    {Object.entries(recipient.variables || {}).map(([key, value]) => (
                      <Badge bg="info" className="me-1" key={key}>
                        {key}: {value}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleShowModal(recipient)}
                      className="me-1"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(recipient.id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {/* 수신자 추가/수정 모달 */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingRecipient ? '수신자 수정' : '수신자 추가'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>이메일</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>변수</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={handleAddVariable}>
                  <FaPlus /> 변수 추가
                </Button>
              </div>
              {Object.entries(formData.variables).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <div className="input-group">
                    <span className="input-group-text">{key}</span>
                    <Form.Control
                      type="text"
                      value={value}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      placeholder={`${key} 값 입력`}
                    />
                    <Button
                      variant="outline-danger"
                      onClick={() => handleRemoveVariable(key)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              ))}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RecipientManager;
