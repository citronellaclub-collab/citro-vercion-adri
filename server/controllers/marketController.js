const prisma = require('../../config/db');

exports.getItems = async (req, res) => {
    try {
        const items = await prisma.marketItem.findMany();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Error cargando tienda' });
    }
};

exports.buyItem = async (req, res) => {
    const userId = req.user.id;
    const { itemId } = req.body;

    try {
        // Transaction: Verify Stock & Balance -> Deduct -> Create Order
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Get User & Item
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const item = await prisma.marketItem.findUnique({ where: { id: itemId } });

            if (!item) throw new Error('Artículo no encontrado');
            if (item.stock < 1) throw new Error('Sin stock');
            if (user.tokens < item.price) throw new Error('Saldo insuficiente');

            // 2. Updates
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { tokens: user.tokens - item.price }
            });

            await prisma.marketItem.update({
                where: { id: itemId },
                data: { stock: item.stock - 1 }
            });

            await prisma.order.create({
                data: {
                    userId,
                    itemId,
                    price: item.price
                }
            });

            return updatedUser;
        });

        res.json({ success: true, newBalance: result.tokens });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};
