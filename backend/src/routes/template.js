const express = require('express');
const router = express.Router();
const DataStore = require('../utils/dataStore');
const templateService = require('../services/templateService');

const templatesStore = new DataStore('templates.json');

/**
 * GET /api/templates
 * 모든 템플릿 조회
 */
router.get('/', async (req, res) => {
  try {
    const templates = await templatesStore.getAll();
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * GET /api/templates/:id
 * 특정 템플릿 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await templatesStore.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        error: true,
        message: '템플릿을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * POST /api/templates
 * 새 템플릿 생성
 */
router.post('/', async (req, res) => {
  try {
    const { name, subject, content, description } = req.body;

    if (!name || !subject || !content) {
      return res.status(400).json({
        error: true,
        message: '이름, 제목, 내용은 필수입니다.'
      });
    }

    // 템플릿 유효성 검사
    const validation = templateService.validateTemplate(content);
    if (!validation.isValid) {
      return res.status(400).json({
        error: true,
        message: '유효하지 않은 템플릿입니다.',
        details: validation.error
      });
    }

    // 템플릿에서 변수 추출
    const variables = templateService.extractVariables(content);

    const template = await templatesStore.add({
      name,
      subject,
      content,
      description: description || '',
      variables
    });

    res.status(201).json({
      success: true,
      message: '템플릿이 생성되었습니다.',
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * PUT /api/templates/:id
 * 템플릿 업데이트
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, subject, content, description } = req.body;

    // 템플릿이 제공되면 유효성 검사
    if (content) {
      const validation = templateService.validateTemplate(content);
      if (!validation.isValid) {
        return res.status(400).json({
          error: true,
          message: '유효하지 않은 템플릿입니다.',
          details: validation.error
        });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (subject) updates.subject = subject;
    if (content) {
      updates.content = content;
      updates.variables = templateService.extractVariables(content);
    }
    if (description !== undefined) updates.description = description;

    const template = await templatesStore.update(req.params.id, updates);

    res.json({
      success: true,
      message: '템플릿이 업데이트되었습니다.',
      data: template
    });
  } catch (error) {
    console.error('Update template error:', error);
    if (error.message === 'Item not found') {
      res.status(404).json({
        error: true,
        message: '템플릿을 찾을 수 없습니다.'
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
 * DELETE /api/templates/:id
 * 템플릿 삭제
 */
router.delete('/:id', async (req, res) => {
  try {
    await templatesStore.delete(req.params.id);

    res.json({
      success: true,
      message: '템플릿이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    if (error.message === 'Item not found') {
      res.status(404).json({
        error: true,
        message: '템플릿을 찾을 수 없습니다.'
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
 * POST /api/templates/:id/preview
 * 템플릿 미리보기
 */
router.post('/:id/preview', async (req, res) => {
  try {
    const template = await templatesStore.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        error: true,
        message: '템플릿을 찾을 수 없습니다.'
      });
    }

    const { sampleVariables } = req.body;
    const preview = templateService.generatePreview(template.content, sampleVariables);

    res.json({
      success: true,
      data: {
        preview,
        variables: template.variables
      }
    });
  } catch (error) {
    console.error('Template preview error:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

module.exports = router;
