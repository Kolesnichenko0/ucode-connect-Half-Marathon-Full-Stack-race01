const Model = require('../models/model');

class Icon extends Model {
    constructor(attributes = {}, tableName = 'icons') {
        super(attributes, tableName);

        if (attributes.file_name && typeof attributes.login !== 'string') {
            throw new Error('Invalid login for Icon.');
        }
    }
}

module.exports = Icon;
