const Handlebars = require('handlebars');

/**
 * 템플릿에서 변수 추출
 * @param {string} template - HTML 템플릿 문자열
 * @returns {Array} 추출된 변수 이름 목록
 */
function extractVariables(template) {
  // Handlebars 변수 패턴: {{variable}} 또는 {{{variable}}}
  const regex = /\{\{?\{?([^}]+)\}?\}?\}/g;
  const variables = new Set();
  let match;

  while ((match = regex.exec(template)) !== null) {
    // 헬퍼나 조건문 제외하고 순수 변수만 추출
    const varName = match[1].trim();
    if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('!')) {
      // 점 표기법(object.property) 지원
      const baseName = varName.split('.')[0].split(' ')[0];
      variables.add(baseName);
    }
  }

  return Array.from(variables);
}

/**
 * 템플릿 컴파일 및 렌더링
 * @param {string} template - HTML 템플릿 문자열
 * @param {Object} variables - 템플릿에 적용할 변수들
 * @returns {string} 렌더링된 HTML
 */
function renderTemplate(template, variables = {}) {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(variables);
  } catch (error) {
    console.error('Template rendering error:', error);
    throw new Error(`템플릿 렌더링 실패: ${error.message}`);
  }
}

/**
 * 템플릿 유효성 검사
 * @param {string} template - HTML 템플릿 문자열
 * @returns {Object} { isValid: boolean, error: string|null }
 */
function validateTemplate(template) {
  try {
    Handlebars.compile(template);
    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * 템플릿 미리보기 생성
 * @param {string} template - HTML 템플릿 문자열
 * @param {Object} sampleVariables - 샘플 변수들
 * @returns {string} 미리보기 HTML
 */
function generatePreview(template, sampleVariables = {}) {
  // 템플릿에서 변수 추출
  const variables = extractVariables(template);

  // 샘플 데이터가 없는 변수는 플레이스홀더로 채움
  const previewData = { ...sampleVariables };
  variables.forEach(varName => {
    if (!previewData[varName]) {
      previewData[varName] = `[${varName}]`;
    }
  });

  return renderTemplate(template, previewData);
}

/**
 * 이메일 제목에 변수 적용
 * @param {string} subject - 제목 템플릿
 * @param {Object} variables - 변수들
 * @returns {string} 렌더링된 제목
 */
function renderSubject(subject, variables = {}) {
  try {
    const compiled = Handlebars.compile(subject);
    return compiled(variables);
  } catch (error) {
    console.error('Subject rendering error:', error);
    return subject; // 에러 시 원본 제목 반환
  }
}

/**
 * 여러 수신자에 대한 개인화된 이메일 생성
 * @param {string} template - HTML 템플릿
 * @param {string} subject - 제목 템플릿
 * @param {Array} recipients - 수신자 목록 (각각 email, name, variables 포함)
 * @returns {Array} 개인화된 이메일 목록
 */
function generatePersonalizedEmails(template, subject, recipients) {
  return recipients.map(recipient => {
    // 기본 변수 + 수신자별 변수 병합
    const variables = {
      name: recipient.name,
      email: recipient.email,
      ...recipient.variables
    };

    return {
      to: recipient.email,
      subject: renderSubject(subject, variables),
      html: renderTemplate(template, variables),
      variables
    };
  });
}

module.exports = {
  extractVariables,
  renderTemplate,
  validateTemplate,
  generatePreview,
  renderSubject,
  generatePersonalizedEmails
};
