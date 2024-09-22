const Model = require('../models/model');

class User extends Model {
    constructor(attributes = {}, tableName = 'users') {
        super(attributes, tableName);

        if (attributes.login && typeof attributes.login !== 'string') {
            throw new Error('Invalid login for User.');
        }

        if (attributes.icon_file_name && typeof attributes.icon_file_name !== 'string') {
            throw new Error('Invalid login for User.');
        }

        if (attributes.password && typeof attributes.password !== 'string') {
            throw new Error('Invalid password for User.');
        }

        if (attributes.full_name && typeof attributes.full_name !== 'string') {
            throw new Error('Invalid full_name for User.');
        }

        if (attributes.email && typeof attributes.email !== 'string') {
            throw new Error('Invalid email for User.');
        }
    }
}

module.exports = User;
