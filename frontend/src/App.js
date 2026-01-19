import React, { useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import EmailEditor from './components/EmailEditor';
import RecipientManager from './components/RecipientManager';
import EmailSender from './components/EmailSender';

function App() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');

  return (
    <div className="App">
      <div className="bg-primary text-white py-3 mb-4">
        <Container>
          <h1>Email Auto Sender</h1>
          <p className="mb-0">Naver와 Google 메일 자동 발송 시스템</p>
        </Container>
      </div>

      <Container>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
          fill
        >
          <Tab eventKey="editor" title="📝 메일 작성">
            <Card>
              <Card.Body>
                <EmailEditor
                  subject={subject}
                  setSubject={setSubject}
                  content={content}
                  setContent={setContent}
                />
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="recipients" title="👥 수신자 관리">
            <Card>
              <Card.Body>
                <RecipientManager onRecipientsChange={setRecipients} />
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="send" title="🚀 발송">
            <Card>
              <Card.Body>
                <EmailSender
                  subject={subject}
                  content={content}
                  recipients={recipients}
                />
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        <footer className="text-center text-muted mt-5 mb-3">
          <small>Email Auto Sender v1.0.0</small>
        </footer>
      </Container>
    </div>
  );
}

export default App;
