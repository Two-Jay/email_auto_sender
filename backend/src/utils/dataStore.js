const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

/**
 * JSON 파일 기반 데이터 저장소 유틸리티
 */
class DataStore {
  constructor(filename) {
    this.filepath = path.join(DATA_DIR, filename);
  }

  /**
   * 데이터 읽기
   */
  async read() {
    try {
      const data = await fs.readFile(this.filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 파일이 없으면 빈 배열 반환
        return [];
      }
      throw error;
    }
  }

  /**
   * 데이터 쓰기
   */
  async write(data) {
    try {
      // 디렉토리가 없으면 생성
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(this.filepath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing to ${this.filepath}:`, error);
      throw error;
    }
  }

  /**
   * 아이템 추가
   */
  async add(item) {
    const data = await this.read();
    const id = Date.now().toString();
    const newItem = { id, ...item, createdAt: new Date().toISOString() };
    data.push(newItem);
    await this.write(data);
    return newItem;
  }

  /**
   * 아이템 업데이트
   */
  async update(id, updates) {
    const data = await this.read();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Item not found');
    }
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(data);
    return data[index];
  }

  /**
   * 아이템 삭제
   */
  async delete(id) {
    const data = await this.read();
    const filtered = data.filter(item => item.id !== id);
    if (filtered.length === data.length) {
      throw new Error('Item not found');
    }
    await this.write(filtered);
    return true;
  }

  /**
   * ID로 아이템 찾기
   */
  async findById(id) {
    const data = await this.read();
    return data.find(item => item.id === id);
  }

  /**
   * 모든 아이템 가져오기
   */
  async getAll() {
    return await this.read();
  }
}

module.exports = DataStore;
