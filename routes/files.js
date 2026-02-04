const express = require('express');
const router = express.Router();
const multer = require('multer');
const File = require('../models/File');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { uploadToS3, getSignedS3Url, deleteFromS3 } = require('../utils/s3');
const { logActivityAsync } = require('../utils/activity');
const { extractAlbumArt } = require('../utils/thumbnail');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/files - List files with optional starred filter
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { starred } = req.query;
        const query = {
            userId: req.user._id,
            isTrashed: false,
            isDeleted: false,
        };

        if (starred === 'true') {
            query.isStarred = true;
        }

        const files = await File.find(query).sort({ type: -1, updatedAt: -1 });

        // Generate signed URLs for files
        const filesWithUrls = await Promise.all(
            files.map(async (file) => {
                const fileObj = file.toObject();
                if (file.s3Key) {
                    fileObj.s3Url = await getSignedS3Url(file.s3Key);
                }
                if (file.thumbnailS3Key) {
                    fileObj.thumbnailUrl = await getSignedS3Url(file.thumbnailS3Key);
                }
                return fileObj;
            })
        );

        res.json({ files: filesWithUrls });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ message: 'Failed to list files' });
    }
});

// POST /api/files/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const parentId = req.body.parentId || null;

        if (!file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const userDoc = await User.findById(req.user._id);
        if (userDoc.storageUsed + file.size > userDoc.storageLimit) {
            return res.status(400).json({ message: 'Storage limit exceeded' });
        }

        const s3Key = `${req.user._id}/${Date.now()}-${file.originalname}`;
        const { url } = await uploadToS3(s3Key, file.buffer, file.mimetype);

        let thumbnailUrl, thumbnailS3Key;

        // Extract album art for audio files
        if (file.mimetype.startsWith('audio/')) {
            try {
                const albumArt = await extractAlbumArt(file.buffer, file.mimetype);
                if (albumArt) {
                    const thumbnailFilename = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}-thumb.jpg`;
                    thumbnailS3Key = `${req.user._id}/thumbnails/${thumbnailFilename}`;
                    const { url: thumbUrl } = await uploadToS3(thumbnailS3Key, albumArt.buffer, albumArt.format);
                    thumbnailUrl = thumbUrl;
                }
            } catch (error) {
                console.error('Failed to extract album art:', error);
            }
        }

        const fileRecord = new File({
            userId: req.user._id,
            parentId: parentId || null,
            name: file.originalname,
            type: 'file',
            mimeType: file.mimetype,
            size: file.size,
            s3Key,
            s3Url: url,
            thumbnailUrl,
            thumbnailS3Key,
        });

        await fileRecord.save();

        userDoc.storageUsed += file.size;
        await userDoc.save();

        // Create notification
        try {
            await Notification.create({
                recipient: req.user._id,
                type: 'info',
                title: 'File uploaded',
                message: `File "${file.originalname}" was uploaded successfully`,
                relatedId: fileRecord._id,
            });
        } catch (notifErr) {
            console.error('Failed to create notification:', notifErr);
        }

        logActivityAsync(req.user._id.toString(), 'file_upload', 'file', fileRecord._id.toString(), file.originalname, { size: file.size, mimeType: file.mimetype });

        res.status(201).json({ file: fileRecord });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'File upload failed' });
    }
});

// GET /api/files/search
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { q, type } = req.query;

        if (!q) {
            return res.json({ results: [] });
        }

        const query = {
            userId: req.user._id,
            name: { $regex: q, $options: 'i' },
            isTrashed: false,
            isDeleted: false,
        };

        if (type && type !== 'all') {
            if (type === 'files') query.type = 'file';
            else if (type === 'folders') query.type = 'folder';
        }

        const results = await File.find(query).sort({ updatedAt: -1 }).limit(50);

        const resultsWithUrls = await Promise.all(
            results.map(async (file) => {
                const fileObj = file.toObject();
                if (file.s3Key) {
                    fileObj.s3Url = await getSignedS3Url(file.s3Key);
                }
                return fileObj;
            })
        );

        res.json({ results: resultsWithUrls });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// GET /api/files/analytics
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        const files = await File.find({
            userId,
            type: 'file',
            isTrashed: false,
            isDeleted: false,
        });

        const categories = {};
        let totalSize = 0;

        files.forEach((file) => {
            const category = getCategoryFromMime(file.mimeType);
            if (!categories[category]) {
                categories[category] = { count: 0, size: 0 };
            }
            categories[category].count++;
            categories[category].size += file.size;
            totalSize += file.size;
        });

        res.json({ categories, totalSize, fileCount: files.length });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to get analytics' });
    }
});

function getCategoryFromMime(mimeType) {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'Documents';
    return 'Other';
}

// GET /api/files/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileObj = file.toObject();
        if (file.s3Key) {
            fileObj.s3Url = await getSignedS3Url(file.s3Key);
        }

        res.json({ file: fileObj });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ message: 'Failed to get file' });
    }
});

// PATCH /api/files/:id
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, isStarred } = req.body;
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const oldName = file.name;

        if (name !== undefined) {
            file.name = name;
            logActivityAsync(req.user._id.toString(), 'file_rename', file.type, file._id.toString(), name, { oldName });
        }

        if (isStarred !== undefined) {
            file.isStarred = isStarred;
            logActivityAsync(req.user._id.toString(), isStarred ? 'file_star' : 'file_unstar', file.type, file._id.toString(), file.name);
        }

        await file.save();
        res.json({ file });
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ message: 'Failed to update file' });
    }
});

// DELETE /api/files/:id (move to trash)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.isTrashed = true;
        file.trashedAt = new Date();
        await file.save();

        // If it's a folder, trash all children
        if (file.type === 'folder') {
            await trashFolderContents(file._id, req.user._id);
        }

        logActivityAsync(req.user._id.toString(), 'file_delete', file.type, file._id.toString(), file.name);

        res.json({ message: 'Moved to trash' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
});

async function trashFolderContents(folderId, userId) {
    const children = await File.find({ parentId: folderId, userId });
    for (const child of children) {
        child.isTrashed = true;
        child.trashedAt = new Date();
        await child.save();
        if (child.type === 'folder') {
            await trashFolderContents(child._id, userId);
        }
    }
}

// GET /api/files/:id/download
router.get('/:id/download', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file || file.type !== 'file') {
            return res.status(404).json({ message: 'File not found' });
        }

        const url = await getSignedS3Url(file.s3Key, 3600);

        logActivityAsync(req.user._id.toString(), 'file_download', 'file', file._id.toString(), file.name);

        res.json({ url });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Failed to get download link' });
    }
});

// GET /api/files/:id/preview
router.get('/:id/preview', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file || file.type !== 'file') {
            return res.status(404).json({ message: 'File not found' });
        }

        const url = await getSignedS3Url(file.s3Key, 3600);
        res.json({ url, mimeType: file.mimeType, name: file.name });
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ message: 'Failed to get preview' });
    }
});

// POST /api/files/:id/move
router.post('/:id/move', authMiddleware, async (req, res) => {
    try {
        const { targetFolderId } = req.body;
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Validate target folder
        if (targetFolderId) {
            const targetFolder = await File.findOne({ _id: targetFolderId, userId: req.user._id, type: 'folder' });
            if (!targetFolder) {
                return res.status(404).json({ message: 'Target folder not found' });
            }
        }

        file.parentId = targetFolderId || null;
        await file.save();

        logActivityAsync(req.user._id.toString(), 'file_move', file.type, file._id.toString(), file.name);

        res.json({ file });
    } catch (error) {
        console.error('Move file error:', error);
        res.status(500).json({ message: 'Failed to move file' });
    }
});

// POST /api/files/:id/copy
router.post('/:id/copy', authMiddleware, async (req, res) => {
    try {
        const { targetFolderId } = req.body;
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id, type: 'file' });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Copy file in S3
        const newS3Key = `${req.user._id}/${Date.now()}-${file.name}`;

        // For simplicity, we'll just create a new DB record pointing to same S3 key
        // In production, you'd want to actually copy the S3 object
        const newFile = new File({
            userId: req.user._id,
            parentId: targetFolderId || null,
            name: `Copy of ${file.name}`,
            type: 'file',
            mimeType: file.mimeType,
            size: file.size,
            s3Key: file.s3Key, // Pointing to same file
            s3Url: file.s3Url,
            thumbnailUrl: file.thumbnailUrl,
            thumbnailS3Key: file.thumbnailS3Key,
        });

        await newFile.save();

        logActivityAsync(req.user._id.toString(), 'file_copy', 'file', newFile._id.toString(), newFile.name);

        res.json({ file: newFile });
    } catch (error) {
        console.error('Copy file error:', error);
        res.status(500).json({ message: 'Failed to copy file' });
    }
});

// POST /api/files/:id/restore
router.post('/:id/restore', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id, isTrashed: true });

        if (!file) {
            return res.status(404).json({ message: 'File not found in trash' });
        }

        file.isTrashed = false;
        file.trashedAt = null;
        await file.save();

        // Restore folder contents
        if (file.type === 'folder') {
            await restoreFolderContents(file._id, req.user._id);
        }

        logActivityAsync(req.user._id.toString(), 'file_restore', file.type, file._id.toString(), file.name);

        res.json({ message: 'Restored successfully', file });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ message: 'Failed to restore file' });
    }
});

async function restoreFolderContents(folderId, userId) {
    const children = await File.find({ parentId: folderId, userId, isTrashed: true });
    for (const child of children) {
        child.isTrashed = false;
        child.trashedAt = null;
        await child.save();
        if (child.type === 'folder') {
            await restoreFolderContents(child._id, userId);
        }
    }
}

// DELETE /api/files/:id/permanent
router.delete('/:id/permanent', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete from S3
        if (file.s3Key) {
            await deleteFromS3(file.s3Key);
        }
        if (file.thumbnailS3Key) {
            await deleteFromS3(file.thumbnailS3Key);
        }

        // Update storage used
        if (file.type === 'file') {
            await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });
        }

        // Delete folder contents
        if (file.type === 'folder') {
            await permanentlyDeleteFolderContents(file._id, req.user._id);
        }

        await File.findByIdAndDelete(file._id);

        logActivityAsync(req.user._id.toString(), 'file_permanent_delete', file.type, file._id.toString(), file.name);

        res.json({ message: 'Permanently deleted' });
    } catch (error) {
        console.error('Permanent delete error:', error);
        res.status(500).json({ message: 'Failed to permanently delete file' });
    }
});

async function permanentlyDeleteFolderContents(folderId, userId) {
    const children = await File.find({ parentId: folderId, userId });
    for (const child of children) {
        if (child.s3Key) {
            await deleteFromS3(child.s3Key);
        }
        if (child.type === 'file') {
            await User.findByIdAndUpdate(userId, { $inc: { storageUsed: -child.size } });
        }
        if (child.type === 'folder') {
            await permanentlyDeleteFolderContents(child._id, userId);
        }
        await File.findByIdAndDelete(child._id);
    }
}

// POST /api/files/:id/share
router.post('/:id/share', authMiddleware, async (req, res) => {
    try {
        const { expiresInSeconds = 600 } = req.body;
        const file = await File.findOne({ _id: req.params.id, userId: req.user._id });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (file.type !== 'file') {
            return res.status(400).json({ message: 'Cannot share a folder' });
        }

        const expiry = Math.min(Math.max(expiresInSeconds, 60), 604800);
        const { randomUUID } = require('crypto');
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + expiry * 1000);

        const ShareLink = require('../models/ShareLink');
        const shareLink = await ShareLink.create({
            fileId: file._id,
            userId: req.user._id,
            token,
            expiresAt,
        });

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const shareUrl = `${baseUrl}/api/share/${token}`;

        logActivityAsync(req.user._id.toString(), 'share_link_create', 'file', file._id.toString(), file.name, { expiresInSeconds: expiry });

        res.json({ shareUrl, token, expiresAt: shareLink.expiresAt, expiresInSeconds: expiry });
    } catch (error) {
        console.error('Share link error:', error);
        res.status(500).json({ message: 'Failed to create share link' });
    }
});

module.exports = router;
