const express = require('express');
const router = express.Router();
const DataStore = require('../utils/dataStore');

const sendersStore = new DataStore('senders.json');

/**
 * GET /api/senders
 * 모든 발신자 조회
 */
router.get('/', async (req, res) => {
  try {
    const senders = await sendersStore.getAll();
    res.json({
      success: true,
      data: senders
    });
  } catch (error) {
    console.error('Get senders error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * GET /api/senders/:id
 * 특정 발신자 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const sender = await sendersStore.findById(req.params.id);

    if (!sender) {
      return res.status(404).json({
        error: true,
        message: '발신자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: sender
    });
  } catch (error) {
    console.error('Get sender error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/senders
 * 새 발신자 생성
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, isDefault } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: true,
        message: '이름과 이메일은 필수입니다.'
      });
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: '유효하지 않은 이메일 주소입니다.'
      });
    }

    // 기본 발신자로 설정하는 경우, 기존 기본 발신자 해제
    if (isDefault) {
      const allSenders = await sendersStore.getAll();
      for (const sender of allSenders) {
        if (sender.isDefault) {
          await sendersStore.update(sender.id, { isDefault: false });
        }
      }
    }

    const sender = await sendersStore.add({
      name,
      email,
      isDefault: isDefault || false
    });

    res.status(201).json({
      success: true,
      message: '발신자가 생성되었습니다.',
      data: sender
    });
  } catch (error) {
    console.error('Create sender error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * PUT /api/senders/:id
 * 발신자 업데이트
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, email, isDefault } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) {
      // 이메일 유효성 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: true,
          message: '유효하지 않은 이메일 주소입니다.'
        });
      }
      updates.email = email;
    }

    // 기본 발신자로 설정하는 경우, 기존 기본 발신자 해제
    if (isDefault === true) {
      const allSenders = await sendersStore.getAll();
      for (const sender of allSenders) {
        if (sender.isDefault && sender.id !== req.params.id) {
          await sendersStore.update(sender.id, { isDefault: false });
        }
      }
    }

    if (isDefault !== undefined) updates.isDefault = isDefault;

    const sender = await sendersStore.update(req.params.id, updates);

    res.json({
      success: true,
      message: '발신자가 업데이트되었습니다.',
      data: sender
    });
  } catch (error) {
    console.error('Update sender error:', error);
    if (error.message === 'Item not found') {
      res.status(404).json({
        error: true,
        message: '발신자를 찾을 수 없습니다.'
      });
    } else {
      res.status(500).json({
        error: true,
        message: error.message
      });
    }
  }
});

/**
 * DELETE /api/senders/:id
 * 발신자 삭제
 */
router.delete('/:id', async (req, res) => {
  try {
    await sendersStore.delete(req.params.id);

    res.json({
      success: true,
      message: '발신자가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete sender error:', error);
    if (error.message === 'Item not found') {
      res.status(404).json({
        error: true,
        message: '발신자를 찾을 수 없습니다.'
      });
    } else {
      res.status(500).json({
        error: true,
        message: error.message
      });
    }
  }
});

/**
 * GET /api/senders/default/current
 * 기본 발신자 조회
 */
router.get('/default/current', async (req, res) => {
  try {
    const senders = await sendersStore.getAll();
    const defaultSender = senders.find(sender => sender.isDefault);

    if (!defaultSender) {
      // 기본 발신자가 없으면 환경변수에서 가져옴
      return res.json({
        success: true,
        data: {
          name: process.env.DEFAULT_SENDER_NAME || 'Email Sender',
          email: process.env.DEFAULT_SENDER_EMAIL || '',
          isDefault: true,
          isFromEnv: true
        }
      });
    }

    res.json({
      success: true,
      data: defaultSender
    });
  } catch (error) {
    console.error('Get default sender error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

module.exports = router;
