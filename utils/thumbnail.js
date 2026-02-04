const mm = require('music-metadata');

async function extractAlbumArt(buffer, mimeType) {
    try {
        const metadata = await mm.parseBuffer(buffer, mimeType);

        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            return {
                buffer: picture.data,
                format: picture.format,
            };
        }

        return null;
    } catch (error) {
        console.error('Failed to extract album art:', error);
        return null;
    }
}

module.exports = { extractAlbumArt };
