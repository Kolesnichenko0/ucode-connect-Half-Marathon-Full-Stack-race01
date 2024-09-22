const pool = require('../config/db');

class Model {
    constructor(attributes = {}, tableName) {
        if (!tableName) {
            throw new Error("tableName is required for Model.");
        }
        this.tableName = tableName;

        if (typeof attributes !== 'object' || Array.isArray(attributes)) {
            throw new Error("Attributes must be an object.");
        }

        // Set attributes (name, description, etc.)
        Object.assign(this, attributes);

        // Connection to the database via pool
        this.connection = pool;
    }

    closeConnection() {
        this.connection.end((err) => {
            if (err) {
                console.error("Error closing the database connection:", err);
            } else {
                console.log("Database connection closed.");
            }
        });
    }

    async find(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid ID for find method.");
        }

        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;

        const [rows] = await this.connection.query(query, [id]);

        if (rows.length === 0) {
            throw new Error(`No record found with ID ${id}`);
        }

        for (const key in rows[0]) {
            if (rows[0].hasOwnProperty(key)) {
                this[key] = rows[0][key];
            }
        }

        return this;
    }

    async findAll() {
        const query = `SELECT * FROM ${this.tableName}`;
        const [rows] = await this.connection.query(query);
        return rows;
    }

    async findAllExcluding(excludeFields = []) {
        const query = `SELECT * FROM ${this.tableName}`;
        const [rows] = await this.connection.query(query);

        return rows.map(row => {
            const result = {...row};
            excludeFields.forEach(field => delete result[field]);
            return result;
        });
    }

    async findByField(fieldName, value) {
        if (typeof fieldName !== 'string' || fieldName.trim() === '') {
            throw new Error("Invalid field name. It should be a non-empty string.");
        }

        let query;
        if (value === null || value === undefined) {
            query = `SELECT * FROM ${this.tableName} WHERE ${fieldName} IS NULL`;
        } else {
            query = `SELECT * FROM ${this.tableName} WHERE ${fieldName} = ?`;
        }

        const [rows] = await this.connection.query(query, [value]);

        if (rows.length === 0) {
            return [];
        }
        return rows.map(row => row.id);
    }

    async delete() {
        if (!this.id || !Number.isInteger(this.id) || this.id <= 0) {
            throw new Error("Invalid ID for delete method.");
        }

        const query = `DELETE FROM ${this.tableName} WHERE id = ?`;

        const [result] = await this.connection.query(query, [this.id]);

        if (result.affectedRows === 0) {
            throw new Error(`No record found with ID ${this.id}`);
        }
    }

    async save() {
        const fields = Object.keys(this).filter(key => key !== 'connection' && key !== 'tableName');
        const values = fields.map(field => this[field]);

        if (!this.id) {
            const placeholders = fields.map(() => '?').join(', ');
            const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
            const [result] = await this.connection.query(sql, values);

            this.id = result.insertId;
        } else {
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
            await this.connection.query(sql, [...values, this.id]);
        }
    }

    async updateField(id, fieldName, newValue) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid ID for updateField method.");
        }

        if (typeof fieldName !== 'string' || fieldName.trim() === '') {
            throw new Error("Invalid field name. It should be a non-empty string.");
        }

        const query = `UPDATE ${this.tableName} SET ${fieldName} = ? WHERE id = ?`;
        const [result] = await this.connection.query(query, [newValue, id]);

        if (result.affectedRows === 0) {
            throw new Error(`No record found with ID ${id}`);
        }

        return result;
    }

    async getColumnValues(columnName) {
        if (typeof columnName !== 'string' || columnName.trim() === '') {
            throw new Error("Invalid column name. It should be a non-empty string.");
        }

        const query = `SELECT ${columnName} FROM ${this.tableName}`;
        const [rows] = await this.connection.query(query);

        return rows.map(row => row[columnName]);
    }
}

module.exports = Model;
