const prisma = require('../../config/db');
const { uploadToBlob } = require('../utils/blobService');

exports.getEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            include: { categories: true },
            orderBy: { date: 'asc' }
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar eventos' });
    }
};

exports.createEvent = async (req, res) => {
    const { title, description, date, time, location, requirements, capacity, categories } = req.body;

    // Verificación de Admin
    if (req.user.role !== 'ADMIN' && !req.user.isDev) {
        return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador' });
    }

    try {
        let flyerUrl = null;
        if (req.file) {
            flyerUrl = await uploadToBlob('events/flyers', req.file);
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                time,
                location,
                requirements,
                capacity: parseInt(capacity),
                flyerUrl,
                categories: {
                    create: JSON.parse(categories) // Expecting array of {name, price, benefits}
                }
            },
            include: { categories: true }
        });

        res.json(event);
    } catch (error) {
        console.error('Error creando evento:', error);
        res.status(500).json({ error: 'Error al crear evento', details: error.message });
    }
};

exports.reserveTicket = async (req, res) => {
    const { categoryId } = req.body;
    const userId = req.user.id;

    try {
        const category = await prisma.ticketCategory.findUnique({
            where: { id: parseInt(categoryId) },
            include: { event: true }
        });

        if (!category) return res.status(404).json({ error: 'Categoría de entrada no encontrada' });

        // 1. Validar Aforo
        const totalReservations = await prisma.reservation.count({
            where: { category: { eventId: category.eventId } }
        });

        if (totalReservations >= category.event.capacity) {
            return res.status(400).json({ error: 'Evento agotado' });
        }

        // 2. Validar Saldo del Socio
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user.tokens < category.price) {
            return res.status(400).json({ error: 'Saldo de tokens insuficiente' });
        }

        // 3. Ejecutar Transacción (Gasto + Reserva)
        const result = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { tokens: { decrement: category.price } }
            }),
            prisma.reservation.create({
                data: {
                    userId,
                    categoryId: category.id,
                    qrCode: `CITRO-${userId}-${category.id}-${Date.now()}` // Mock QR
                }
            })
        ]);

        res.json({
            message: 'Reserva confirmada con éxito',
            tokens: result[0].tokens,
            reservation: result[1]
        });

    } catch (error) {
        console.error('Error en reserva:', error);
        res.status(500).json({ error: 'Error al procesar la reserva' });
    }
};

exports.getMyReservations = async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            where: { userId: req.user.id },
            include: {
                category: {
                    include: { event: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar tus reservas' });
    }
};
