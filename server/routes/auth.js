const router = require('express').Router();
const authController = require('../controllers/authController');

const auth = require('../auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', auth, authController.getMe);

// Email verification endpoints
router.post('/resend-verification', auth, authController.resendVerification);
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;
