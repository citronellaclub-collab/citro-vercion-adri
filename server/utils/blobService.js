const { put, del } = require('@vercel/blob');

/**
 * Citro Multimedia Service
 * Centralizes Vercel Blob operations for Crops and Marketplace.
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const uploadToBlob = async (folder, file) => {
    if (!BLOB_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
    }

    console.log(`[Blob Service] Uploading to ${folder}: ${file.originalname}`);
    const blob = await put(`${folder}/${Date.now()}-${file.originalname}`, file.buffer, {
        access: 'public',
        token: BLOB_TOKEN
    });

    return blob.url;
};

const deleteFromBlob = async (urls) => {
    if (!urls || (Array.isArray(urls) && urls.length === 0)) return;
    if (!BLOB_TOKEN) return;

    const urlArray = Array.isArray(urls) ? urls : [urls];
    const citroUrls = urlArray.filter(url => url && url.includes('public.blob.vercel-storage.com'));

    if (citroUrls.length > 0) {
        console.log(`[Blob Service] Deleting ${citroUrls.length} file(s)`);
        await del(citroUrls, { token: BLOB_TOKEN });
    }
};

module.exports = {
    uploadToBlob,
    deleteFromBlob
};
