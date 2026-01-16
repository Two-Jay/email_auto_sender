const xlsx = require('xlsx');
const { XMLParser } = require('fast-xml-parser');

/**
 * Excel 파일 파싱
 * @param {Buffer} buffer - 파일 버퍼
 * @returns {Array} 파싱된 수신자 목록
 */
function parseExcel(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // 데이터 정규화 (다양한 컬럼명 지원)
    return data.map((row, index) => {
      // 이메일 필드 찾기 (대소문자 구분 없이)
      const email = findField(row, ['email', 'Email', 'EMAIL', '이메일', 'e-mail']);

      // 이름 필드 찾기
      const name = findField(row, ['name', 'Name', 'NAME', '이름', '성명']);

      // 나머지 필드들은 변수로 사용
      const variables = {};
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'email' && lowerKey !== 'name' &&
            lowerKey !== 'e-mail' && lowerKey !== '이메일' && lowerKey !== '이름' && lowerKey !== '성명') {
          variables[key] = row[key];
        }
      });

      if (!email) {
        throw new Error(`Row ${index + 1}: Email field not found`);
      }

      return {
        email: email.toString().trim(),
        name: name ? name.toString().trim() : '',
        variables
      };
    });
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error(`Excel 파일 파싱 실패: ${error.message}`);
  }
}

/**
 * XML 파일 파싱
 * @param {Buffer} buffer - 파일 버퍼
 * @returns {Array} 파싱된 수신자 목록
 */
function parseXML(buffer) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });

    const xmlData = parser.parse(buffer.toString());

    // XML 구조에서 수신자 목록 찾기
    // 지원하는 구조: <recipients><recipient>...</recipient></recipients>
    // 또는: <recipients><item>...</item></recipients>
    let recipients = [];

    if (xmlData.recipients) {
      const items = xmlData.recipients.recipient || xmlData.recipients.item || xmlData.recipients.person;
      recipients = Array.isArray(items) ? items : [items];
    } else if (xmlData.recipient) {
      recipients = Array.isArray(xmlData.recipient) ? xmlData.recipient : [xmlData.recipient];
    } else if (xmlData.root && xmlData.root.recipient) {
      recipients = Array.isArray(xmlData.root.recipient) ? xmlData.root.recipient : [xmlData.root.recipient];
    } else {
      // 최상위 객체가 배열인 경우
      const keys = Object.keys(xmlData);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const items = xmlData[firstKey];
        recipients = Array.isArray(items) ? items : [items];
      }
    }

    return recipients.map((recipient, index) => {
      const email = findField(recipient, ['email', 'Email', 'EMAIL', '이메일', 'e-mail']);
      const name = findField(recipient, ['name', 'Name', 'NAME', '이름', '성명']);

      // 나머지 필드들은 변수로 사용
      const variables = {};
      Object.keys(recipient).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'email' && lowerKey !== 'name' &&
            lowerKey !== 'e-mail' && lowerKey !== '이메일' && lowerKey !== '이름' && lowerKey !== '성명' &&
            !key.startsWith('@_')) {
          variables[key] = recipient[key];
        }
      });

      if (!email) {
        throw new Error(`Item ${index + 1}: Email field not found`);
      }

      return {
        email: email.toString().trim(),
        name: name ? name.toString().trim() : '',
        variables
      };
    });
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error(`XML 파일 파싱 실패: ${error.message}`);
  }
}

/**
 * 다양한 필드명에서 값 찾기 (대소문자 구분 없이)
 */
function findField(obj, fieldNames) {
  for (const fieldName of fieldNames) {
    if (obj[fieldName] !== undefined) {
      return obj[fieldName];
    }
  }
  return null;
}

/**
 * 파일 형식에 따라 적절한 파서 선택
 */
function parseFile(buffer, mimetype, filename) {
  const extension = filename.split('.').pop().toLowerCase();

  if (mimetype.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') {
    return parseExcel(buffer);
  } else if (mimetype.includes('xml') || extension === 'xml') {
    return parseXML(buffer);
  } else {
    throw new Error('지원하지 않는 파일 형식입니다. Excel(.xlsx, .xls) 또는 XML(.xml) 파일만 지원합니다.');
  }
}

module.exports = {
  parseExcel,
  parseXML,
  parseFile
};
