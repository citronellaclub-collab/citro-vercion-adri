const prisma = require('../../config/db');
const { uploadToBlob, deleteFromBlob } = require('../utils/blobService');

// --- EXPLORAR OFERTAS (GTL STYLE: FILTROS + SORT + REPUTACIÓN) ---
exports.getProducts = async (req, res) => {
    const {
        category,
        search,
        minPrice,
        maxPrice,
        sortBy,
        page = 1,
        limit = 12,
        isVerified,
        wishlistedOnly
    } = req.query;
    const userId = req.user.id;

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Construir filtros de búsqueda
        const where = {
            status: 'Active',
            ...(category && category !== 'Todos' ? { category } : {}),
            ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
            ...(minPrice || maxPrice ? {
                price: {
                    ...(minPrice ? { gte: parseInt(minPrice) } : {}),
                    ...(maxPrice ? { lte: parseInt(maxPrice) } : {})
                }
            } : {}),
            ...(isVerified === 'true' ? { seller: { isVerified: true } } : {}),
            ...(wishlistedOnly === 'true' ? { wishlistedBy: { some: { userId } } } : {})
        };

        // Construir ordenamiento
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'price_asc') orderBy = { price: 'asc' };
        if (sortBy === 'price_desc') orderBy = { price: 'desc' };
        if (sortBy === 'stock') orderBy = { stock: 'desc' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    seller: {
                        select: {
                            username: true,
                            isVerified: true,
                            sellerReviews: { select: { rating: true } }
                        }
                    },
                    wishlistedBy: { where: { userId }, select: { id: true } }
                },
                orderBy,
                skip,
                take
            }),
            prisma.product.count({ where })
        ]);

        // Calcular reputación promedio para cada vendedor en el resultado
        const productsWithMeta = products.map(p => {
            const ratings = p.seller.sellerReviews.map(r => r.rating);
            const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

            return {
                ...p,
                avgRating,
                reviewCount: ratings.length,
                isWishlisted: p.wishlistedBy.length > 0,
                isOffer: p.price < p.basePrice
            };
        });

        res.json({ products: productsWithMeta, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
    } catch (error) {
        console.error('[Market Error] getProducts:', error);
        res.status(500).json({ error: 'Error al cargar las ofertas del club' });
    }
};

// --- MIS PUBLICACIONES (Sustituye a Mis Ventas) ---
exports.getMyProducts = async (req, res) => {
    const userId = req.user.id;
    try {
        const products = await prisma.product.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar tus publicaciones' });
    }
};

// --- PUBLICAR PRODUCTO (NUEVA PUBLICACIÓN) ---
exports.createProduct = async (req, res) => {
    const { name, description, category, price, stock, imageUrl } = req.body;
    const userId = req.user.id;

    try {
        const numPrice = parseInt(price) || 0;
        let finalImageUrl = imageUrl || null;

        // Si se envió un archivo directamente (Multipart)
        if (req.file) {
            finalImageUrl = await uploadToBlob('market', req.file);
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                category: category || 'Otros',
                price: numPrice,
                basePrice: numPrice,
                stock: parseInt(stock) || 1,
                imageUrl: finalImageUrl,
                sellerId: userId,
                status: 'Active'
            }
        });
        res.json(product);
    } catch (error) {
        console.error('[Market Error] createProduct:', error);
        res.status(500).json({ error: 'Error al crear la publicación' });
    }
};

// --- GESTIONAR PRODUCTO (Editar/Pausar + Notificar Bajada de Precio) ---
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { price, stock, status } = req.body;
    const userId = req.user.id;

    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { wishlistedBy: true }
        });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        if (product.sellerId !== userId) return res.status(403).json({ error: 'No autorizado' });

        const newPrice = price !== undefined ? parseInt(price) : product.price;
        const isPriceDrop = newPrice < product.price;

        const updated = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                price: newPrice,
                ...(stock !== undefined && { stock: parseInt(stock) }),
                ...(status && { status })
            }
        });

        // Si bajó de precio, notificar a todos los que lo tienen en wishlist
        if (isPriceDrop && product.wishlistedBy.length > 0) {
            const notifications = product.wishlistedBy.map(w => ({
                userId: w.userId,
                message: `¡Oferta! El producto "${product.name}" que te interesa ha bajado a ${newPrice} 🟢.`
            }));
            await prisma.notification.createMany({ data: notifications });
        }

        res.json(updated);
    } catch (error) {
        console.error('[Market Error] updateProduct:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

// --- WISHLIST: TOGGLE FAVORITO ---
exports.toggleWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;

    try {
        const existing = await prisma.wishlist.findUnique({
            where: { userId_productId: { userId, productId: parseInt(productId) } }
        });

        if (existing) {
            await prisma.wishlist.delete({ where: { id: existing.id } });
            return res.json({ status: 'removed' });
        } else {
            await prisma.wishlist.create({ data: { userId, productId: parseInt(productId) } });
            return res.json({ status: 'added' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar favoritos' });
    }
};

// --- NOTIFICACIONES: OBTENER Y MARCAR COMO LEIDAS ---
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar notificaciones' });
    }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true }
        });
        res.json({ message: 'Notificaciones leídas' });
    } catch (error) {
        res.status(500).json({ error: 'Error al leer notificaciones' });
    }
};

// --- ELIMINAR PRODUCTO Y LIMPIAR MULTIMEDIA ---
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
        if (!product) return res.status(404).json({ error: 'Publicación no encontrada' });
        if (product.sellerId !== userId) return res.status(403).json({ error: 'Acción no autorizada' });

        // 1. Limpieza de imagen vía servicio central
        if (product.imageUrl) {
            await deleteFromBlob(product.imageUrl);
        }

        // 2. Borrado de la base de datos
        // Se mantiene la integridad con OrderItem ya que no hay borrado en cascada forzado aquí, 
        // pero Prisma requiere manejar las relaciones si existen.
        await prisma.product.delete({ where: { id: parseInt(id) } });

        res.json({ message: 'Publicación eliminada correctamente' });
    } catch (error) {
        console.error('[Market Error] deleteProduct:', error);
        res.status(500).json({ error: 'Error al eliminar la publicación' });
    }
};
