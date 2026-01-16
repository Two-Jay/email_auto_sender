const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const templateService = require('../services/templateService');

/**
 * POST /api/email/send
 * 단일 이메일 발송
 */
router.post('/send', async (req, res) => {
  try {
    const { from, to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: true,
        message: '수신자, 제목, 본문은 필수입니다.'
      });
    }

    const result = await emailService.sendEmail({ from, to, subject, html, text });

    if (result.success) {
      res.json({
        success: true,
        message: '이메일이 성공적으로 발송되었습니다.',
        data: result
      });
    } else {
      res.status(500).json({
        error: true,
        message: '이메일 발송 실패',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/email/send-bulk
 * 여러 이메일 일괄 발송
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { template, subject, recipients, from, delay = 1000 } = req.body;

    if (!template || !subject || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        error: true,
        message: '템플릿, 제목, 수신자 목록은 필수입니다.'
      });
    }

    // 개인화된 이메일 생성
    const personalizedEmails = templateService.generatePersonalizedEmails(
      template,
      subject,
      recipients
    );

    // from 정보 추가
    const emailsWithFrom = personalizedEmails.map(email => ({
      ...email,
      from
    }));

    // 일괄 발송
    const results = await emailService.sendBulkEmails(emailsWithFrom, { delay });

    res.json({
      success: true,
      message: `${results.success}/${results.total} 이메일 발송 완료`,
      data: results
    });
  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/email/preview
 * 이메일 미리보기 생성
 */
router.post('/preview', async (req, res) => {
  try {
    const { template, sampleVariables } = req.body;

    if (!template) {
      return res.status(400).json({
        error: true,
        message: '템플릿은 필수입니다.'
      });
    }

    const preview = templateService.generatePreview(template, sampleVariables);

    res.json({
      success: true,
      data: {
        preview,
        variables: templateService.extractVariables(template)
      }
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/email/test
 * 테스트 이메일 발송
 */
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: true,
        message: '수신자 이메일은 필수입니다.'
      });
    }

    const result = await emailService.sendTestEmail(to);

    if (result.success) {
      res.json({
        success: true,
        message: '테스트 이메일이 발송되었습니다.',
        data: result
      });
    } else {
      res.status(500).json({
        error: true,
        message: '테스트 이메일 발송 실패',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * GET /api/email/test-connection
 * SMTP 연결 테스트
 */
router.get('/test-connection', async (req, res) => {
  try {
    const result = await emailService.testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        error: true,
        message: result.message,
        details: result.error
      });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

module.exports = router;
