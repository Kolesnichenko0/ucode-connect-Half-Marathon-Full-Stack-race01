const {check, validationResult} = require('express-validator');
const User = require('../models/user');
const path = require('path');

// Display login page
exports.getLoginPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
};

// Process login request
exports.processLogin = [
    // Field validation
    check('login').matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Invalid login: 3-20 characters, letters, numbers, underscores only.'),
    check('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long.'),

    async (req, res) => {
        try {
            // Check validation results
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({error: errors.array()[0].msg});
            }

            const {login, password} = req.body;

            const user = new User();

            const userIds = await user.findByField('login', login);

            if (userIds.length === 0) {
                return res.status(400).json({error: 'Could not find a user with this login.'});
            }

            await user.find(userIds[0]);

            if (user.password !== password) {
                return res.status(400).json({error: 'Invalid password.'});
            }

            req.session.userId = user.id;
            res.status(201).end();
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
];
