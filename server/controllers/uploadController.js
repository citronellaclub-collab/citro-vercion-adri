const { put } = require('@vercel/blob');

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        if (!blobToken) {
            console.warn('⚠️ BLOB_READ_WRITE_TOKEN no configurado. Las imágenes no se guardarán permanentemente en Vercel.');
            // En desarrollo local sin token, podríamos devolver una URL falsa o error
            return res.status(500).json({ error: 'Servicio de almacenamiento no configurado (Token faltante)' });
        }

        // Subir archivo a Vercel Blob
        const blob = await put(`citro/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
            access: 'public',
            token: blobToken
        });

        res.json({ url: blob.url });
    } catch (err) {
        console.error('Error en carga de imagen:', err);
        res.status(500).json({ error: 'Error al procesar la imagen en la nube', details: err.message });
    }
};
