const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { logActivityAsync } = require('../utils/activity');

// POST /api/folders - Create a new folder
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, parentId } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Validate parent folder
        if (parentId) {
            const parentFolder = await File.findOne({
                _id: parentId,
                userId: req.user._id,
                type: 'folder',
            });
            if (!parentFolder) {
                return res.status(404).json({ error: 'Parent folder not found' });
            }
        }

        // Check for duplicate name
        const existingFolder = await File.findOne({
            userId: req.user._id,
            parentId: parentId || null,
            name: name.trim(),
            type: 'folder',
            isTrashed: false,
        });

        if (existingFolder) {
            return res.status(400).json({ error: 'A folder with this name already exists' });
        }

        const folder = new File({
            userId: req.user._id,
            parentId: parentId || null,
            name: name.trim(),
            type: 'folder',
            size: 0,
        });

        await folder.save();

        // Create notification
        try {
            await Notification.create({
                recipient: req.user._id,
                type: 'success',
                title: 'Folder created',
                message: `Folder "${name.trim()}" was created successfully`,
                relatedId: folder._id,
            });
        } catch (notifErr) {
            console.error('Failed to create notification:', notifErr);
        }

        logActivityAsync(req.user._id.toString(), 'folder_create', 'folder', folder._id.toString(), name.trim());

        res.status(201).json({ folder });
    } catch (error) {
        console.error('Folder creation error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

module.exports = router;
