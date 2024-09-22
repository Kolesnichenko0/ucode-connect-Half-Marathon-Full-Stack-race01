const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const passwordReminderController = require('../controllers/passwordReminderController');
const userController = require('../controllers/userController');
const path = require('path');

const authMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

router.get('/', (req, res) => {
    res.redirect('/register');
});

// Registration routes
router.get('/register', registerController.getRegisterPage);
router.post('/register-process', registerController.processRegister);

// Login routes
router.get('/login', loginController.getLoginPage);
router.post('/login-process', loginController.processLogin);

// Password recovery routes
router.get('/forgot-password-email', passwordReminderController.getForgotPasswordEmailPage);
router.post('/recover-password-by-email', passwordReminderController.recoverPasswordByEmail);

router.get('/forgot-password-login', passwordReminderController.getForgotPasswordLoginPage);
router.post('/recover-password-by-login', passwordReminderController.recoverPasswordByLogin);

// Route for the home page
router.get('/main', authMiddleware, userController.getMainPage);

// Logout route
router.post('/logout', authMiddleware, userController.logout);

// Route to retrieve user information
router.get('/user-info', authMiddleware, userController.getUserInfo);

router.get('/all-cards-info', authMiddleware, userController.getAllCardsInfo);

router.get('/all-cards', authMiddleware, userController.getAllCardsPage);

router.get('/rules', authMiddleware, userController.getRulesPage);

router.post('/change-icon', userController.changeUserIcon);

// Page 404
router.get('*', (req, res) => {
    res.status(404).render(path.join(__dirname, '..', 'views', '404.html'));
});

module.exports = router;
