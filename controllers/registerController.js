const {check, validationResult} = require('express-validator');
const User = require('../models/user');
const path = require('path');

exports.getRegisterPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
};

function getRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * 5) + 1;
    return randomIndex;
}

exports.processRegister = [
    check('login').matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Invalid login: 3-20 characters, letters, numbers, underscores only.'),
    check('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/).withMessage('Invalid password: 8-20 characters, at least one lowercase, uppercase, digit, special character.'),
    check('fullName').matches(/^[a-zA-Z\s]{2,}$/).withMessage('Invalid full name: 2-100 characters, letters and spaces only.'),
    check('email').isEmail().withMessage('Invalid email'),

    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({error: errors.array()[0].msg});
            }

            const {login, password, fullName, email} = req.body;

            const user = new User({
                login: login,
                password: password,
                full_name: fullName,
                email: email,
                icon_id: getRandomAvatar()
            });

            const existingUserWithSameLogin = await user.findByField('login', login);
            if (existingUserWithSameLogin.length > 0) {
                return res.status(400).json({error: 'User with this login already exists.'});
            }

            const existingUserWithSameEmail = await user.findByField('email', email);
            if (existingUserWithSameEmail.length > 0) {
                return res.status(400).json({error: 'User with this email already exists.'});
            }

            await user.save();
            req.session.userId = user.id;
            res.status(201).json({message: 'User registered successfully!'});
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
];
