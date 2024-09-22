const {check, validationResult} = require('express-validator');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const path = require('path');

// Nodemailer transport configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'leola46@ethereal.email',
        pass: 'yQJNM4wNK3CURxbDEs'
    }
});

// Display forgot password page by email
exports.getForgotPasswordEmailPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'password_reminder_email.html'));
};

// Display forgot password page by login
exports.getForgotPasswordLoginPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'password_reminder_login.html'));
};

// Process password recovery by email
exports.recoverPasswordByEmail = [
    check('email').isEmail().withMessage('Invalid email'),
    async (req, res) => {
        try {
            // Check validation results
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({error: errors.array()[0].msg});
            }

            const email = req.body.email;
            const user = new User();
            const userIds = await user.findByField('email', email);

            if (userIds.length === 0) {
                return res.status(404).json({error: 'No user found with this email'});
            }

            await user.find(userIds[0]);

            const mailOptions = {
                from: transporter.options.auth.user,
                to: user.email,
                subject: 'Password Reminder - User Management System',
                html: `
                    <h1>Hello, ${user.full_name}</h1>
                    <p>We have received a request to remind your password. Here are your details:</p>
                    <p><strong>Login:</strong> ${user.login}</p>
                    <p><strong>Password:</strong> ${user.password}</p>
                    <p>Best regards,<br/>User Management System</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({error: error.message});
                }
                res.json({message: 'Password reminder sent successfully to your email.'});
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
];

// Process password recovery by login
exports.recoverPasswordByLogin = [
    check('login').matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Invalid login: 3-20 characters, letters, numbers, underscores only.'),
    async (req, res) => {
        try {
            // Check validation results
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({error: errors.array()[0].msg});
            }

            const login = req.body.login;
            const user = new User();
            const userIds = await user.findByField('login', login);

            if (userIds.length === 0) {
                return res.status(404).json({error: 'Could not find a user with this login.'});
            }

            await user.find(userIds[0]);

            const mailOptions = {
                from: transporter.options.auth.user,
                to: user.email,
                subject: 'Password Reminder - User Management System',
                html: `
                    <h1>Hello, ${user.full_name}</h1>
                    <p>We have received a request to remind your password. Here are your details:</p>
                    <p><strong>Login:</strong> ${user.login}</p>
                    <p><strong>Password:</strong> ${user.password}</p>
                    <p>Best regards,<br/>User Management System</p>
                `
            };

            let maskedEmail = user.email.replace(/(.).*(.@.*)/, function (_, a, b) {
                let stars = '*'.repeat(a.length);
                return stars + b;
            });

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({error: error.message});
                }
                res.json({email: maskedEmail});
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
];
