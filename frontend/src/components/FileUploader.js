import React, { useState, useRef } from 'react';
import { recipientAPI } from '../services/apiService';

const FileUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 파일 형식 확인
    const allowedExtensions = ['xlsx', 'xls', 'xml'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setError('지원하지 않는 파일 형식입니다. Excel(.xlsx, .xls) 또는 XML(.xml) 파일만 업로드 가능합니다.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setPreview(null);

    // 파일 미리보기
    await parseFile(selectedFile);
  };

  const parseFile = async (file) => {
    setParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await recipientAPI.parseFile(formData);

      if (response.data.success) {
        setPreview(response.data.data);
      }
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !preview) return;

    const groupName = prompt('수신자 그룹 이름을 입력하세요:', file.name.replace(/\.[^/.]+$/, ''));
    if (!groupName) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', groupName);

      const response = await recipientAPI.uploadFile(formData);

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadSuccess) {
          onUploadSuccess(response.data.data);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-uploader">
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.xml"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary"
        >
          📁 파일 선택
        </button>
        {file && (
          <span className="file-name">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </span>
        )}
      </div>

      {parsing && (
        <div className="parsing-status">
          ⏳ 파일을 분석하는 중...
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {preview && (
        <div className="preview-section">
          <h3>📊 파일 미리보기</h3>
          <div className="preview-stats">
            <p><strong>파일명:</strong> {preview.filename}</p>
            <p><strong>수신자 수:</strong> {preview.count}명</p>
            <p><strong>감지된 변수:</strong> {preview.variables.join(', ') || '없음'}</p>
          </div>

          {preview.recipients && preview.recipients.length > 0 && (
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>기타 변수</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.recipients.map((recipient, index) => (
                    <tr key={index}>
                      <td>{recipient.email}</td>
                      <td>{recipient.name || '-'}</td>
                      <td>
                        {Object.keys(recipient.variables || {}).length > 0
                          ? JSON.stringify(recipient.variables)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.count > 5 && (
                <p className="preview-note">
                  * 처음 5개 항목만 표시됩니다. 전체 {preview.count}개 항목이 업로드됩니다.
                </p>
              )}
            </div>
          )}

          <div className="action-buttons">
            <button onClick={handleUpload} className="btn btn-success">
              ✅ 업로드
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              🔄 초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
