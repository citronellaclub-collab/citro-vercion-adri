const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../auth');
const marketController = require('../controllers/marketController');
const forumController = require('../controllers/forumController');

/* === CROPS MODULE === */
router.get('/crops', auth, async (req, res) => {
    try {
        const crops = await prisma.crop.findMany({
            where: { userId: req.user.id },
            include: { logs: { orderBy: { createdAt: 'desc' } } }
        });
        res.json(crops);
    } catch (err) { res.status(500).json({ error: 'Error fetching crops' }); }
});

router.post('/crops', auth, async (req, res) => {
    try {
        const newCrop = await prisma.crop.create({
            data: { bucketName: req.body.bucketName, userId: req.user.id, status: 'Verde' }
        });
        res.json(newCrop);
    } catch (err) { res.status(500).json({ error: 'Error creating crop' }); }
});

router.post('/crops/:id/logs', auth, async (req, res) => {
    const { id } = req.params;
    const { ph, ec, week, message } = req.body; // unified log body
    try {
        const crop = await prisma.crop.findUnique({ where: { id: parseInt(id) } });
        if (!crop || crop.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        // Logic for Status
        let newStatus = 'Verde';
        const numPh = parseFloat(ph);
        if (numPh < 5.5 || numPh > 6.5) newStatus = 'Amarillo';
        if (numPh < 5.0 || numPh > 7.0) newStatus = 'Rojo';

        const log = await prisma.cropLog.create({
            data: {
                cropId: parseInt(id),
                week: week || 'Semana X',
                ph: numPh,
                ec: parseFloat(ec),
                imageUrl: message || '' // reusing field for now
            }
        });

        await prisma.crop.update({ where: { id: parseInt(id) }, data: { status: newStatus } });
        res.json(log);
    } catch (err) { res.status(500).json({ error: 'Error logging' }); }
});

/* === MARKET MODULE === */
router.get('/market', auth, marketController.getItems);
router.post('/market/buy', auth, marketController.buyItem);

/* === FORUM MODULE === */
router.get('/forum', auth, forumController.getPosts);
router.post('/forum', auth, forumController.createPost);

module.exports = router;
