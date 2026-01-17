const prisma = require('../../config/db');
const { uploadToBlob, deleteFromBlob } = require('../utils/blobService');

// --- Helper: Calcular Salud y Generar Feedback ---
const calculateHealthAndAdvice = (ph, ec, phase) => {
    let status = 'Verde';
    let advices = [];

    // Lógica de pH (Ideal 5.8 - 6.2)
    if (ph < 5.5) {
        status = ph < 5.0 ? 'Rojo' : 'Amarillo';
        advices.push('pH bajo detectado. Usar pH Up / Incrementador de pH.');
    } else if (ph > 6.5) {
        status = ph > 7.0 ? 'Rojo' : 'Amarillo';
        advices.push('pH alto detectado. Usar pH Down / Reductor de pH para evitar bloqueo de nutrientes.');
    }

    // Lógica de EC por Fase
    let ecRange = { min: 0.4, max: 0.8 };
    if (phase === 'Vegetación') ecRange = { min: 1.2, max: 1.6 };
    if (phase === 'Floración') ecRange = { min: 1.8, max: 2.2 };
    if (phase === 'Senescencia') ecRange = { min: 1.0, max: 1.4 };

    if (ec < ecRange.min) {
        status = (status === 'Rojo' ? 'Rojo' : 'Amarillo');
        advices.push(`EC baja para ${phase}. Aumentar ligeramente la dosis de nutrientes base.`);
    } else if (ec > ecRange.max + 0.4) {
        status = 'Rojo';
        advices.push(`EC crítica (> ${ecRange.max}). Riesgo de sobrefertilización. Diluir con agua pura o realizar flush.`);
    } else if (ec > ecRange.max) {
        status = (status === 'Rojo' ? 'Rojo' : 'Amarillo');
        advices.push(`EC alta para ${phase}. Monitorear puntas de hojas y reducir nutrientes.`);
    }

    return { status, feedback: advices.join(' ') || 'Parámetros en rango óptimo. ¡Buen trabajo!' };
};

exports.getCrops = async (req, res) => {
    try {
        const crops = await prisma.crop.findMany({
            where: { userId: req.user.id },
            include: { logs: { orderBy: { createdAt: 'desc' }, take: 5 } } // Últimos 5 logs
        });
        res.json(crops);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener cultivos' });
    }
};

exports.createCrop = async (req, res) => {
    try {
        const { bucketName } = req.body;
        let imageUrl = req.body.imageUrl || null;

        // Si hay archivo, subirlo a Vercel Blob vía servicio central
        if (req.file) {
            try {
                imageUrl = await uploadToBlob('crops', req.file);
            } catch (blobError) {
                console.error('[Blob Error] Fallo al subir imagen de cultivo:', blobError);
                throw new Error('Error al subir imagen a la nube.');
            }
        }

        const newCrop = await prisma.crop.create({
            data: {
                bucketName,
                imageUrl,
                userId: req.user.id,
                status: 'Verde'
            }
        });
        res.json(newCrop);
    } catch (err) {
        console.error('[Crop Error] createCrop:', err);
        res.status(500).json({ error: 'Error al crear balde' });
    }
};

exports.addLog = async (req, res) => {
    const { id } = req.params;
    const { ph, ec, week, phase, notes, grow, micro, bloom } = req.body;
    let imageUrl = req.body.imageUrl || null;

    try {
        if (!id) return res.status(400).json({ error: 'ID de cultivo requerido' });

        // Verificar propiedad
        const crop = await prisma.crop.findUnique({ where: { id: parseInt(id) } });
        if (!crop) return res.status(404).json({ error: 'Cultivo no encontrado' });
        if (crop.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

        // Si hay archivo, subirlo a Vercel Blob vía servicio central
        if (req.file) {
            try {
                imageUrl = await uploadToBlob('logs', req.file);
            } catch (blobError) {
                console.error('[Blob Error] Fallo al subir imagen de seguimiento:', blobError);
                throw new Error('Error al subir imagen a la nube.');
            }
        }

        // Parsing seguro
        const numPh = parseFloat(ph) || 0;
        const numEc = parseFloat(ec) || 0;
        const numGrow = parseFloat(grow) || 0;
        const numMicro = parseFloat(micro) || 0;
        const numBloom = parseFloat(bloom) || 0;

        const { status, feedback } = calculateHealthAndAdvice(numPh, numEc, phase || 'Vegetación');

        const log = await prisma.cropLog.create({
            data: {
                cropId: parseInt(id),
                week: week || 'Sin Semana',
                phase: phase || 'Vegetación',
                ph: numPh,
                ec: numEc,
                grow: numGrow,
                micro: numMicro,
                bloom: numBloom,
                notes: notes || '',
                imageUrl: imageUrl,
                feedback: feedback || 'Sin feedback disponible'
            }
        });

        // Actualizar estado del cultivo 'padre'
        await prisma.crop.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        return res.json({ log, status, feedback });

    } catch (err) {
        console.error('CRITICAL ERROR in addLog:', err);
        return res.status(500).json({ error: 'Error interno al registrar bitácora', details: err.message });
    }
};

// --- GET LOGS ---
exports.getLogs = async (req, res) => {
    const { id } = req.params;
    try {
        const logs = await prisma.cropLog.findMany({
            where: { cropId: parseInt(id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching logs' });
    }
};

exports.deleteLog = async (req, res) => {
    const { id } = req.params;
    try {
        const log = await prisma.cropLog.findUnique({
            where: { id: parseInt(id) },
            include: { crop: true }
        });

        if (!log) return res.status(404).json({ error: 'Registro no encontrado' });
        if (log.crop.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

        // Si hay imagen en la nube, borrarla vía servicio central
        if (log.imageUrl) {
            await deleteFromBlob(log.imageUrl);
        }

        await prisma.cropLog.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar registro' });
    }
};

exports.deleteCrop = async (req, res) => {
    const { id } = req.params;
    try {
        const crop = await prisma.crop.findUnique({
            where: { id: parseInt(id) },
            include: { logs: true }
        });

        if (!crop) return res.status(404).json({ error: 'Cultivo no encontrado' });
        if (crop.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

        // 1. Recopilar todas las URLs de imágenes (del cultivo y de sus logs)
        const imageUrls = [crop.imageUrl, ...crop.logs.map(l => l.imageUrl)].filter(url => url && url.includes('public.blob.vercel-storage.com'));

        // 2. Borrar imágenes de Vercel Blob vía servicio central
        if (imageUrls.length > 0) {
            await deleteFromBlob(imageUrls);
        }

        // 3. Borrar registros y cultivo (Prisma manejará la cascada si está configurada, o lo hacemos manual)
        // Por seguridad y control, borramos los logs primero
        await prisma.cropLog.deleteMany({ where: { cropId: parseInt(id) } });
        await prisma.crop.delete({ where: { id: parseInt(id) } });

        res.json({ message: 'Cultivo y datos asociados eliminados correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar cultivo' });
    }
};
