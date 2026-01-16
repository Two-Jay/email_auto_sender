const nodemailer = require('nodemailer');

/**
 * SMTP Transporter 생성
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * 단일 이메일 발송
 * @param {Object} emailOptions - 이메일 옵션
 * @param {string} emailOptions.from - 발신자 (name <email>)
 * @param {string} emailOptions.to - 수신자
 * @param {string} emailOptions.subject - 제목
 * @param {string} emailOptions.html - HTML 본문
 * @param {string} emailOptions.text - 텍스트 본문 (선택)
 * @returns {Promise<Object>} 발송 결과
 */
async function sendEmail({ from, to, subject, html, text }) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: from || `${process.env.DEFAULT_SENDER_NAME} <${process.env.DEFAULT_SENDER_EMAIL}>`,
      to,
      subject,
      html,
      text: text || '' // HTML을 텍스트로 변환하거나 비워둠
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      to,
      subject
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message,
      to,
      subject
    };
  }
}

/**
 * 여러 이메일 일괄 발송
 * @param {Array} emails - 이메일 목록
 * @param {Object} options - 발송 옵션
 * @param {number} options.delay - 각 이메일 사이 지연 시간(ms)
 * @param {Function} options.onProgress - 진행 상황 콜백
 * @returns {Promise<Object>} 발송 결과 요약
 */
async function sendBulkEmails(emails, { delay = 1000, onProgress = null } = {}) {
  const results = {
    total: emails.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    try {
      const result = await sendEmail(email);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }

      results.details.push(result);

      // 진행 상황 콜백 호출
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: emails.length,
          result
        });
      }

      // 다음 이메일 전송 전 지연
      if (i < emails.length - 1 && delay > 0) {
        await sleep(delay);
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        success: false,
        error: error.message,
        to: email.to,
        subject: email.subject
      });
    }
  }

  return results;
}

/**
 * SMTP 연결 테스트
 * @returns {Promise<Object>} 테스트 결과
 */
async function testConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    return {
      success: true,
      message: 'SMTP 연결 성공'
    };
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return {
      success: false,
      message: 'SMTP 연결 실패',
      error: error.message
    };
  }
}

/**
 * 테스트 이메일 발송
 * @param {string} to - 수신자 이메일
 * @returns {Promise<Object>} 발송 결과
 */
async function sendTestEmail(to) {
  const testEmail = {
    to,
    subject: '📧 이메일 발송 테스트',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">이메일 발송 테스트</h2>
        <p>이메일 자동 발신 시스템이 정상적으로 작동하고 있습니다.</p>
        <p style="color: #666; font-size: 14px;">
          이 이메일은 ${new Date().toLocaleString('ko-KR')}에 발송되었습니다.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Email Auto Sender - Automated Email System
        </p>
      </div>
    `,
    text: '이메일 자동 발신 시스템 테스트 이메일입니다.'
  };

  return await sendEmail(testEmail);
}

/**
 * 지연 함수
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  sendEmail,
  sendBulkEmails,
  testConnection,
  sendTestEmail
};
