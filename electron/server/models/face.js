// server/models/face.js
const fs = require('fs').promises;
const path = require('path');

// 数据文件存储路径 (类似本地的 IndexedDB 库)
const dataFilePath = path.join(__dirname, '../faces_data.json');

class Face {
    constructor(data) {
        this.id = data.id;
        this.age = data.age || null;
        this.country = data.country || null;
        this.hair = data.hair || null;
        this.hair_color = data.hair_color || null;
        this.face_type = data.face_type || null;
        this.expression = data.expression || null;
        this.dimple = data.dimple || 0;
        this.sex = data.sex !== undefined ? data.sex : 1;
        this.eye_color = data.eye_color || null;
        this.skin = data.skin !== undefined ? data.skin : 50;
        this.skin_color = data.skin_color || null;
        this.skin_detail = data.skin_detail !== undefined ? data.skin_detail : 50;
        this.mole = data.mole || 0;

        this.nose = data.nose || null;
        this.double_eyelid = data.double_eyelid !== undefined ? data.double_eyelid : 50;
        this.mouth = data.mouth || null;
        this.chin = data.chin || null;

        this.light_type = data.light_type || null;
        this.light_direction = data.light_direction || null;
        this.status = data.status || 'PENDING';
        this.wanxiang_task_id = data.wanxiang_task_id || null;
        this.result_url = data.result_url || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // 模拟 Sequelize 的 save() 方法
    async save() {
        this.updatedAt = new Date().toISOString();
        const data = await Face._readData();
        const index = data.findIndex(item => item.id === this.id);
        if (index !== -1) {
            data[index] = this;
        } else {
            data.push(this);
        }
        await Face._writeData(data);
        return this;
    }

    // 模拟 toJSON() 方法
    toJSON() {
        return { ...this };
    }

    // --- 静态方法 ---

    static async _readData() {
        try {
            const content = await fs.readFile(dataFilePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            // 如果文件不存在，返回空数组
            if (error.code === 'ENOENT') return [];
            throw error;
        }
    }

    static async _writeData(data) {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    // 模拟 Sequelize 的 create() 方法
    static async create(data) {
        const allData = await this._readData();
        // 自动生成递增 ID
        const maxId = allData.length > 0 ? Math.max(...allData.map(d => d.id)) : 0;
        data.id = maxId + 1;

        const newFace = new Face(data);
        allData.push(newFace);
        await this._writeData(allData);
        return newFace;
    }

    // 模拟 Sequelize 的 findByPk() 方法
    static async findByPk(id) {
        const allData = await this._readData();
        const item = allData.find(d => d.id === parseInt(id));
        return item ? new Face(item) : null;
    }

    static async update(updates, options) {
        const allData = await this._readData();
        const targetId = options.where.id;
        const index = allData.findIndex(d => d.id === parseInt(targetId));
        if (index !== -1) {
            allData[index] = { ...allData[index], ...updates, updatedAt: new Date().toISOString() };
            await this._writeData(allData);
        }
    }
}

module.exports = Face;