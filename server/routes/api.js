const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../auth');
const marketController = require('../controllers/marketController');
const orderController = require('../controllers/orderController');
const forumController = require('../controllers/forumController');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const uploadController = require('../controllers/uploadController');

/* === CROPS MODULE === */
const cropController = require('../controllers/cropController');

router.get('/crops', auth, cropController.getCrops);
router.post('/crops', auth, upload.single('image'), cropController.createCrop);
router.delete('/crops/:id', auth, cropController.deleteCrop);
router.post('/crops/:id/logs', auth, upload.single('image'), cropController.addLog);
router.get('/crops/:id/logs', auth, cropController.getLogs);
router.delete('/logs/:id', auth, cropController.deleteLog);

/* === UPLOAD MODULE === */
router.post('/upload', auth, upload.single('image'), uploadController.uploadImage);

/* === MARKET MODULE === */
router.get('/market', auth, marketController.getProducts);
router.get('/market/my-sales', auth, marketController.getMyProducts);
router.post('/market', auth, upload.single('image'), marketController.createProduct);
router.put('/market/:id', auth, marketController.updateProduct);
router.delete('/market/:id', auth, marketController.deleteProduct);

// Wishlist & Notificaciones
router.post('/market/wishlist', auth, marketController.toggleWishlist);
router.get('/notifications', auth, marketController.getNotifications);
router.post('/notifications/read', auth, marketController.markNotificationsRead);

/* === ORDERS MODULE === */
router.post('/orders', auth, orderController.createOrder);
router.get('/orders', auth, orderController.getOrders);
router.get('/orders/sales', auth, orderController.getSalesHistory);
router.post('/orders/:id/review', auth, orderController.createReview);

const eventsController = require('../controllers/eventsController');

const adminController = require('../controllers/adminController');

/* === FORUM MODULE === */
router.get('/forum', auth, forumController.getPosts);
router.post('/forum', auth, upload.array('attachments', 5), forumController.createPost);
router.post('/forum/:id/comment', auth, forumController.addComment);
router.post('/forum/:id/subscribe', auth, forumController.toggleSubscription);
router.post('/forum/:id/react', auth, forumController.reactToPost);
router.get('/forum/subscriptions', auth, forumController.getSubscriptions);
router.delete('/forum/:id', auth, forumController.deletePost);

/* === EVENTS MODULE === */
router.get('/events', auth, eventsController.getEvents);
router.post('/events', auth, upload.single('flyer'), eventsController.createEvent);
router.post('/events/reserve', auth, eventsController.reserveTicket);
router.get('/events/my-reservations', auth, eventsController.getMyReservations);

/* === ADMIN MODULE === */
router.post('/admin/verify', auth, adminController.verifyStaff);
router.get('/admin/users', auth, adminController.getUsers);
router.post('/admin/tokens', auth, adminController.updateUserTokens);
router.post('/admin/legal', auth, adminController.updateLegal);
router.post('/admin/forum/:postId', auth, adminController.moderatePost);

module.exports = router;
