const express = require('express');
const router = express.Router();
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');
const { getSignedS3Url } = require('../utils/s3');

// GET /api/drive/root - Get root folder contents
router.get('/root', authMiddleware, async (req, res) => {
    try {
        const { type } = req.query;
        const query = {
            userId: req.user._id,
            parentId: null,
            isTrashed: false,
            isDeleted: false,
        };

        if (type && type !== 'all') {
            if (type === 'files') query.type = 'file';
            else if (type === 'folders') query.type = 'folder';
        }

        const items = await File.find(query).sort({ type: -1, name: 1 });

        const itemsWithUrls = await Promise.all(
            items.map(async (item) => {
                const itemObj = item.toObject();
                if (item.s3Key) {
                    itemObj.s3Url = await getSignedS3Url(item.s3Key);
                }
                if (item.thumbnailS3Key) {
                    itemObj.thumbnailUrl = await getSignedS3Url(item.thumbnailS3Key);
                }
                return itemObj;
            })
        );

        res.json({ items: itemsWithUrls, breadcrumbs: [] });
    } catch (error) {
        console.error('Get root error:', error);
        res.status(500).json({ message: 'Failed to get files' });
    }
});

// GET /api/drive/folder/:id - Get folder contents
router.get('/folder/:id', authMiddleware, async (req, res) => {
    try {
        const { type } = req.query;
        const folderId = req.params.id;

        // Verify folder exists and belongs to user
        const folder = await File.findOne({
            _id: folderId,
            userId: req.user._id,
            type: 'folder',
        });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        const query = {
            userId: req.user._id,
            parentId: folderId,
            isTrashed: false,
            isDeleted: false,
        };

        if (type && type !== 'all') {
            if (type === 'files') query.type = 'file';
            else if (type === 'folders') query.type = 'folder';
        }

        const items = await File.find(query).sort({ type: -1, name: 1 });

        const itemsWithUrls = await Promise.all(
            items.map(async (item) => {
                const itemObj = item.toObject();
                if (item.s3Key) {
                    itemObj.s3Url = await getSignedS3Url(item.s3Key);
                }
                if (item.thumbnailS3Key) {
                    itemObj.thumbnailUrl = await getSignedS3Url(item.thumbnailS3Key);
                }
                return itemObj;
            })
        );

        // Build breadcrumbs
        const breadcrumbs = await buildBreadcrumbs(folder);

        res.json({ items: itemsWithUrls, breadcrumbs });
    } catch (error) {
        console.error('Get folder error:', error);
        res.status(500).json({ message: 'Failed to get folder contents' });
    }
});

async function buildBreadcrumbs(folder) {
    const breadcrumbs = [];
    let current = folder;

    while (current) {
        breadcrumbs.unshift({ _id: current._id.toString(), name: current.name });
        if (current.parentId) {
            current = await File.findById(current.parentId);
        } else {
            current = null;
        }
    }

    return breadcrumbs;
}

module.exports = router;
