import React, { useState, useEffect } from 'react';
import EmailEditor from './components/EmailEditor';
import FileUploader from './components/FileUploader';
import { emailAPI, templateAPI, recipientAPI, senderAPI } from './services/apiService';
import './App.css';

function App() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('compose'); // compose, recipients, templates, senders
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [senders, setSenders] = useState([]);
  const [selectedSender, setSelectedSender] = useState(null);
  const [recipientGroups, setRecipientGroups] = useState([]);
  const [selectedRecipientGroup, setSelectedRecipientGroup] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadSenders();
    loadRecipientGroups();
    loadTemplates();
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const response = await emailAPI.testConnection();
      setConnectionStatus(response.data.success ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const loadSenders = async () => {
    try {
      const response = await senderAPI.getAll();
      setSenders(response.data.data);

      // 기본 발신자 설정
      const defaultSender = response.data.data.find(s => s.isDefault);
      if (defaultSender) {
        setSelectedSender(defaultSender);
      }
    } catch (error) {
      console.error('Failed to load senders:', error);
    }
  };

  const loadRecipientGroups = async () => {
    try {
      const response = await recipientAPI.getAll();
      setRecipientGroups(response.data.data);
    } catch (error) {
      console.error('Failed to load recipient groups:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await templateAPI.getAll();
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // 이메일 미리보기
  const handlePreview = async () => {
    try {
      const response = await emailAPI.preview({
        template: emailContent,
        sampleVariables: {
          name: '홍길동',
          email: 'example@email.com'
        }
      });
      setPreviewHtml(response.data.data.preview);
    } catch (error) {
      alert('미리보기 생성 실패: ' + error.message);
    }
  };

  // 이메일 발송
  const handleSend = async () => {
    if (!emailContent || !emailSubject) {
      alert('제목과 본문을 입력해주세요.');
      return;
    }

    if (!selectedRecipientGroup) {
      alert('수신자 그룹을 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedRecipientGroup.count}명에게 이메일을 발송하시겠습니까?`)) {
      return;
    }

    setSending(true);

    try {
      const fromEmail = selectedSender
        ? `${selectedSender.name} <${selectedSender.email}>`
        : undefined;

      const response = await emailAPI.sendBulk({
        template: emailContent,
        subject: emailSubject,
        recipients: selectedRecipientGroup.recipients,
        from: fromEmail,
        delay: 1000
      });

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
      }
    } catch (error) {
      alert('❌ 이메일 발송 실패: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // 템플릿 저장
  const handleSaveTemplate = async () => {
    const name = prompt('템플릿 이름을 입력하세요:');
    if (!name) return;

    try {
      await templateAPI.create({
        name,
        subject: emailSubject,
        content: emailContent,
        description: ''
      });
      alert('✅ 템플릿이 저장되었습니다.');
      loadTemplates();
    } catch (error) {
      alert('❌ 템플릿 저장 실패: ' + error.message);
    }
  };

  // 템플릿 불러오기
  const handleLoadTemplate = async (template) => {
    setEmailSubject(template.subject);
    setEmailContent(template.content);
    setSelectedTemplate(template);
    setActiveTab('compose');
  };

  // 발신자 추가
  const handleAddSender = async () => {
    const name = prompt('발신자 이름:');
    if (!name) return;
    const email = prompt('발신자 이메일:');
    if (!email) return;

    try {
      await senderAPI.create({ name, email, isDefault: false });
      alert('✅ 발신자가 추가되었습니다.');
      loadSenders();
    } catch (error) {
      alert('❌ 발신자 추가 실패: ' + error.message);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>📧 이메일 자동 발신 시스템</h1>
        <div className="connection-status">
          {connectionStatus === 'connected' && <span className="status-connected">🟢 연결됨</span>}
          {connectionStatus === 'disconnected' && <span className="status-disconnected">🔴 연결 끊김</span>}
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'compose' ? 'active' : ''}
          onClick={() => setActiveTab('compose')}
        >
          ✉️ 이메일 작성
        </button>
        <button
          className={activeTab === 'recipients' ? 'active' : ''}
          onClick={() => setActiveTab('recipients')}
        >
          👥 수신자 관리
        </button>
        <button
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          📝 템플릿 관리
        </button>
        <button
          className={activeTab === 'senders' ? 'active' : ''}
          onClick={() => setActiveTab('senders')}
        >
          👤 발신자 관리
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'compose' && (
          <div className="compose-section">
            <h2>이메일 작성</h2>

            <div className="form-group">
              <label>발신자</label>
              <select
                value={selectedSender?.id || ''}
                onChange={(e) => {
                  const sender = senders.find(s => s.id === e.target.value);
                  setSelectedSender(sender);
                }}
              >
                <option value="">기본 발신자</option>
                {senders.map(sender => (
                  <option key={sender.id} value={sender.id}>
                    {sender.name} ({sender.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>수신자 그룹</label>
              <select
                value={selectedRecipientGroup?.id || ''}
                onChange={(e) => {
                  const group = recipientGroups.find(g => g.id === e.target.value);
                  setSelectedRecipientGroup(group);
                }}
              >
                <option value="">수신자 그룹 선택</option>
                {recipientGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.count}명)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="이메일 제목 (템플릿 변수 사용 가능: {{name}})"
              />
            </div>

            <div className="form-group">
              <label>본문</label>
              <EmailEditor
                value={emailContent}
                onChange={setEmailContent}
                placeholder="이메일 본문을 작성하세요. 템플릿 변수를 사용하려면 {{변수명}} 형식으로 입력하세요."
              />
            </div>

            <div className="action-buttons">
              <button onClick={handlePreview} className="btn btn-secondary">
                👁️ 미리보기
              </button>
              <button onClick={handleSaveTemplate} className="btn btn-info">
                💾 템플릿 저장
              </button>
              <button
                onClick={handleSend}
                className="btn btn-primary"
                disabled={sending}
              >
                {sending ? '📤 발송 중...' : '📤 이메일 발송'}
              </button>
            </div>

            {previewHtml && (
              <div className="preview-section">
                <h3>미리보기</h3>
                <div
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipients' && (
          <div className="recipients-section">
            <h2>수신자 관리</h2>

            <div className="section-content">
              <h3>파일 업로드</h3>
              <FileUploader onUploadSuccess={loadRecipientGroups} />

              <h3>수신자 그룹 목록</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>그룹명</th>
                    <th>수신자 수</th>
                    <th>생성일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {recipientGroups.map(group => (
                    <tr key={group.id}>
                      <td>{group.name}</td>
                      <td>{group.count}명</td>
                      <td>{new Date(group.createdAt).toLocaleString('ko-KR')}</td>
                      <td>
                        <button
                          onClick={async () => {
                            if (window.confirm('삭제하시겠습니까?')) {
                              try {
                                await recipientAPI.delete(group.id);
                                loadRecipientGroups();
                              } catch (error) {
                                alert('삭제 실패: ' + error.message);
                              }
                            }
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️ 삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-section">
            <h2>템플릿 관리</h2>

            <table className="data-table">
              <thead>
                <tr>
                  <th>템플릿명</th>
                  <th>제목</th>
                  <th>변수</th>
                  <th>생성일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{template.subject}</td>
                    <td>{template.variables?.join(', ') || '-'}</td>
                    <td>{new Date(template.createdAt).toLocaleString('ko-KR')}</td>
                    <td>
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="btn btn-primary btn-sm"
                      >
                        📥 불러오기
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('삭제하시겠습니까?')) {
                            try {
                              await templateAPI.delete(template.id);
                              loadTemplates();
                            } catch (error) {
                              alert('삭제 실패: ' + error.message);
                            }
                          }
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ 삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'senders' && (
          <div className="senders-section">
            <h2>발신자 관리</h2>

            <button onClick={handleAddSender} className="btn btn-success">
              ➕ 발신자 추가
            </button>

            <table className="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>기본 발신자</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {senders.map(sender => (
                  <tr key={sender.id}>
                    <td>{sender.name}</td>
                    <td>{sender.email}</td>
                    <td>{sender.isDefault ? '✅' : '-'}</td>
                    <td>
                      {!sender.isDefault && (
                        <button
                          onClick={async () => {
                            try {
                              await senderAPI.update(sender.id, { isDefault: true });
                              loadSenders();
                            } catch (error) {
                              alert('업데이트 실패: ' + error.message);
                            }
                          }}
                          className="btn btn-info btn-sm"
                        >
                          ⭐ 기본으로 설정
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (window.confirm('삭제하시겠습니까?')) {
                            try {
                              await senderAPI.delete(sender.id);
                              loadSenders();
                            } catch (error) {
                              alert('삭제 실패: ' + error.message);
                            }
                          }
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ 삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
