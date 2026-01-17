const prisma = require('../../config/db');

// --- COMPRAR (Checkout Carrito) ---
exports.createOrder = async (req, res) => {
    const { items } = req.body; // Array de { productId, quantity }
    const buyerId = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Obtener productos y validar
            let totalPrice = 0;
            const productIds = items.map(i => i.productId);
            const dbProducts = await tx.product.findMany({
                where: { id: { in: productIds } }
            });

            if (dbProducts.length !== items.length) {
                throw new Error('Uno o más productos no existen');
            }

            // 2. Comprobaciones de Stock y Cálculo de Total
            for (const item of items) {
                const product = dbProducts.find(p => p.id === item.productId);
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}`);
                }
                if (product.sellerId === buyerId) {
                    throw new Error(`No puedes comprar tu propio producto: ${product.name}`);
                }
                totalPrice += product.price * item.quantity;
            }

            // 3. Validar Saldo del Comprador
            const buyer = await tx.user.findUnique({ where: { id: buyerId } });
            if (buyer.tokens < totalPrice) {
                throw new Error(`Saldo insuficiente. Necesitas ${totalPrice} tokens.`);
            }

            // 4. Realizar Transferencias y Actualizar Stock
            // Descontar al comprador
            await tx.user.update({
                where: { id: buyerId },
                data: { tokens: { decrement: totalPrice } }
            });

            // Pagar a cada vendedor y descontar stock
            for (const item of items) {
                const product = dbProducts.find(p => p.id === item.productId);

                await tx.user.update({
                    where: { id: product.sellerId },
                    data: { tokens: { increment: product.price * item.quantity } }
                });

                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } }
                });
            }

            // 5. Crear el Pedido Consolidado
            const order = await tx.order.create({
                data: {
                    buyerId,
                    totalPrice,
                    status: 'Pendiente',
                    items: {
                        create: items.map(item => {
                            const p = dbProducts.find(prod => prod.id === item.productId);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price: p.price // Capturamos el precio actual
                            };
                        })
                    }
                },
                include: { items: { include: { product: true } } }
            });

            return order;
        });

        res.json({ success: true, order: result });

    } catch (error) {
        console.error('Error en Checkout:', error);
        res.status(400).json({ error: error.message });
    }
};

// --- HISTORIAL DE PEDIDOS (MIS COMPRAS) ---
exports.getOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const orders = await prisma.order.findMany({
            where: { buyerId: userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: { seller: { select: { username: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
};

// --- HISTORIAL DE VENTAS (LO QUE ME COMPRARON) ---
exports.getSalesHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const sales = await prisma.orderItem.findMany({
            where: {
                product: { sellerId: userId }
            },
            include: {
                order: {
                    include: { buyer: { select: { username: true } } }
                },
                product: true
            },
            orderBy: { order: { createdAt: 'desc' } }
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial de ventas' });
    }
};
// --- CALIFICAR INTERCAMBIO ---
exports.createReview = async (req, res) => {
    const { id } = req.params; // Order ID
    const { rating, comment } = req.body;
    const userId = req.user.id;

    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: { items: true, review: true }
        });

        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
        if (order.buyerId !== userId) return res.status(403).json({ error: 'No autorizado' });
        if (order.status !== 'Entregado') return res.status(400).json({ error: 'Solo se pueden calificar pedidos entregados' });
        if (order.review) return res.status(400).json({ error: 'Este pedido ya ha sido calificado' });

        // En este MVP, calificamos el primer producto del pedido o el pedido en general
        // Vinculamos la reseña al primer producto del pedido para simplificar
        const firstItem = order.items[0];

        const review = await prisma.review.create({
            data: {
                rating: parseInt(rating) || 5,
                comment: comment || '',
                orderId: order.id,
                productId: firstItem.productId,
                sellerId: (await prisma.product.findUnique({ where: { id: firstItem.productId } })).sellerId
            }
        });

        res.json({ success: true, review });
    } catch (error) {
        console.error('[Order Error] createReview:', error);
        res.status(500).json({ error: 'Error al procesar la reseña' });
    }
};
