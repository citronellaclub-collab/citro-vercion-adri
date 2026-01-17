const router = require('express').Router();

console.log('🔀 AUTH ROUTES LOADING...');

let authController;
try {
    authController = require('../controllers/authController');
    console.log('🔀 AUTH CONTROLLER LOADED IN ROUTES');
} catch (error) {
    console.error('❌ AUTH CONTROLLER LOAD FAILED:', error.message);
}

let auth;
try {
    auth = require('../auth');
    console.log('🔀 AUTH MIDDLEWARE LOADED');
} catch (error) {
    console.error('❌ AUTH MIDDLEWARE LOAD FAILED:', error.message);
}

console.log('🔀 AUTH ROUTES SETUP COMPLETE');

router.post('/register', async (req, res) => {
    console.log('📝 REGISTER ROUTE HIT');
    if (!authController?.register) {
        return res.status(500).json({ error: 'Controller not loaded' });
    }
    try {
        await authController.register(req, res);
    } catch (error) {
        console.error('❌ ROUTE ERROR:', error);
        res.status(500).json({ error: 'Route execution failed' });
    }
});

router.post('/login', async (req, res) => {
    console.log('🔑 LOGIN ROUTE HIT');
    // Simplified login for now
    res.json({ error: 'Login temporarily disabled' });
});
router.get('/me', auth, authController.getMe);

// Email verification endpoints
router.put('/update-email', auth, authController.updateEmail);
router.post('/resend-verification', auth, authController.resendVerification);
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;
