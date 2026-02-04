const express = require('express');
const router = express.Router();
const ShareLink = require('../models/ShareLink');
const File = require('../models/File');
const { getSignedS3Url } = require('../utils/s3');

// GET /api/share/:token - Public endpoint for downloading shared files
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const shareLink = await ShareLink.findOne({
            token,
            expiresAt: { $gt: new Date() },
        });

        if (!shareLink) {
            return res.status(404).json({ message: 'Share link not found or expired' });
        }

        // Check download limit
        if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
            return res.status(403).json({ message: 'Download limit reached' });
        }

        const file = await File.findById(shareLink.fileId);

        if (!file || file.isTrashed || file.isDeleted) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Generate signed URL
        const downloadUrl = await getSignedS3Url(file.s3Key, 3600);

        // Increment download count
        shareLink.downloadCount++;
        await shareLink.save();

        // Redirect to download
        res.redirect(downloadUrl);
    } catch (error) {
        console.error('Share download error:', error);
        res.status(500).json({ message: 'Failed to process share link' });
    }
});

module.exports = router;
