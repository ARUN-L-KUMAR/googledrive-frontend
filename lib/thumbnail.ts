import { parseBuffer } from 'music-metadata';

interface AlbumArtResult {
    buffer: Buffer;
    format: string;
}

/**
 * Extract album art from audio file buffer
 * @param fileBuffer - The audio file buffer
 * @param mimeType - The MIME type of the audio file
 * @returns Album art buffer and format, or null if no artwork found
 */
export async function extractAlbumArt(
    fileBuffer: Buffer,
    mimeType: string
): Promise<AlbumArtResult | null> {
    try {
        // Only process audio files
        if (!mimeType.startsWith('audio/')) {
            return null;
        }

        // Parse the audio file metadata
        const metadata = await parseBuffer(fileBuffer, { mimeType });

        // Debug logging
        if (metadata.common.picture) {
            console.log(`Found ${metadata.common.picture.length} pictures`);
            console.log('First picture format:', metadata.common.picture[0].format);
        } else {
            console.log('No picture field in metadata');
        }

        // Check if album art exists
        if (!metadata.common.picture || metadata.common.picture.length === 0) {
            return null;
        }

        // Get the first picture (usually the cover art)
        const picture = metadata.common.picture[0];

        return {
            buffer: Buffer.from(picture.data),
            format: picture.format || 'image/jpeg', // Default to JPEG if format not specified
        };
    } catch (error) {
        console.error('Error extracting album art:', error);
        return null;
    }
}
