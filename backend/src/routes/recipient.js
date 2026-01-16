const express = require('express');
const router = express.Router();
const multer = require('multer');
const DataStore = require('../utils/dataStore');
const fileParserService = require('../services/fileParserService');

const recipientsStore = new DataStore('recipients.json');

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/xml',
      'application/xml'
    ];

    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.match(/\.(xlsx|xls|xml)$/)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. Excel 또는 XML 파일만 업로드 가능합니다.'));
    }
  }
});

/**
 * GET /api/recipients
 * 모든 수신자 그룹 조회
 */
router.get('/', async (req, res) => {
  try {
    const recipients = await recipientsStore.getAll();
    res.json({
      success: true,
      data: recipients
    });
  } catch (error) {
    console.error('Get recipients error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * GET /api/recipients/:id
 * 특정 수신자 그룹 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const group = await recipientsStore.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        error: true,
        message: '수신자 그룹을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get recipient group error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/recipients
 * 새 수신자 그룹 생성 (수동 입력)
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, recipients } = req.body;

    if (!name || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        error: true,
        message: '그룹 이름과 수신자 목록은 필수입니다.'
      });
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of recipients) {
      if (!recipient.email || !emailRegex.test(recipient.email)) {
        return res.status(400).json({
          error: true,
          message: `유효하지 않은 이메일: ${recipient.email || '(비어있음)'}`
        });
      }
    }

    const group = await recipientsStore.add({
      name,
      description: description || '',
      recipients,
      count: recipients.length,
      source: 'manual'
    });

    res.status(201).json({
      success: true,
      message: '수신자 그룹이 생성되었습니다.',
      data: group
    });
  } catch (error) {
    console.error('Create recipient group error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/recipients/upload
 * 파일 업로드를 통한 수신자 그룹 생성
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: '파일이 제공되지 않았습니다.'
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: true,
        message: '그룹 이름은 필수입니다.'
      });
    }

    // 파일 파싱
    const recipients = fileParserService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (recipients.length === 0) {
      return res.status(400).json({
        error: true,
        message: '파일에서 수신자를 찾을 수 없습니다.'
      });
    }

    const group = await recipientsStore.add({
      name,
      description: description || '',
      recipients,
      count: recipients.length,
      source: 'file',
      filename: req.file.originalname
    });

    res.status(201).json({
      success: true,
      message: `${recipients.length}명의 수신자가 포함된 그룹이 생성되었습니다.`,
      data: group
    });
  } catch (error) {
    console.error('Upload recipients error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/recipients/parse
 * 파일 미리보기 (저장하지 않고 파싱만)
 */
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: '파일이 제공되지 않았습니다.'
      });
    }

    // 파일 파싱
    const recipients = fileParserService.parseFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // 변수 추출
    const variableKeys = new Set();
    recipients.forEach(recipient => {
      Object.keys(recipient.variables || {}).forEach(key => {
        variableKeys.add(key);
      });
    });

    res.json({
      success: true,
      data: {
        count: recipients.length,
        recipients: recipients.slice(0, 5), // 처음 5개만 미리보기
        variables: Array.from(variableKeys),
        filename: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Parse file error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * PUT /api/recipients/:id
 * 수신자 그룹 업데이트
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, recipients } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (recipients) {
      updates.recipients = recipients;
      updates.count = recipients.length;
    }

    const group = await recipientsStore.update(req.params.id, updates);

    res.json({
      success: true,
      message: '수신자 그룹이 업데이트되었습니다.',
      data: group
    });
  } catch (error) {
    console.error('Update recipient group error:', error);
    if (error.message === 'Item not found') {
      res.status(404).json({
        error: true,
        message: '수신자 그룹을 찾을 수 없습니다.'
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
 * DELETE /api/recipients/:id
 * 수신자 그룹 삭제
 */
router.delete('/:id', async (req, res) => {
  try {
    await recipientsStore.delete(req.params.id);

    res.json({
      success: true,
      message: '수신자 그룹이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete recipient group error:', error);
    if (error.message === 'Item not found') {
      res.status(404).json({
        error: true,
        message: '수신자 그룹을 찾을 수 없습니다.'
      });
    } else {
      res.status(500).json({
        error: true,
        message: error.message
      });
    }
  }
});

module.exports = router;
