const Model = require('../models/model');

class Card extends Model {
    constructor(attributes = {}, tableName = 'cards') {
        super(attributes, tableName);

        if (attributes.character_name && typeof attributes.character_name !== 'string') {
            throw new Error('Invalid character_name for Card.');
        }

        if (attributes.description && typeof attributes.description !== 'string') {
            throw new Error('Invalid description for Card.');
        }

        if (attributes.attack_points && !Number.isInteger(attributes.attack_points)) {
            throw new Error('Invalid attack_points for Card.');
        }

        if (attributes.defense_points && !Number.isInteger(attributes.defense_points)) {
            throw new Error('Invalid defense_points for Card.');
        }

        if (attributes.price && !Number.isInteger(attributes.price)) {
            throw new Error('Invalid price for Card.');
        }

        if (attributes.image_file_name && typeof attributes.image_file_name !== 'string') {
            throw new Error('Invalid image_file_name for Card.');
        }
    }
}

module.exports = Card;
