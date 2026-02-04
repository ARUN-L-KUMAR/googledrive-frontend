const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { uploadToS3, getSignedS3Url, deleteFromS3 } = require('../utils/s3');
const { generateToken } = require('../utils/auth');
const { logActivityAsync } = require('../utils/activity');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let profilePictureUrl = user.profilePicture;

        // If it's an S3 key (starts with user ID), generate signed URL
        if (profilePictureUrl && profilePictureUrl.startsWith(user._id.toString())) {
            profilePictureUrl = await getSignedS3Url(profilePictureUrl);
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: profilePictureUrl,
                emailVerified: user.emailVerified,
                authProvider: user.authProvider,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Failed to get profile' });
    }
});

// PATCH /api/users/profile
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;

        await user.save();

        logActivityAsync(req.user._id.toString(), 'profile_update', 'user', req.user._id.toString(), user.email);

        // Generate new token with updated info
        const token = generateToken(user);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.json({ message: 'Profile updated', user: { firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// POST /api/users/password
router.post('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password required' });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        logActivityAsync(req.user._id.toString(), 'password_change', 'user', req.user._id.toString(), user.email);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Failed to change password' });
    }
});

// POST /api/users/avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const user = await User.findById(req.user._id);

        // Delete old avatar from S3 if exists
        if (user.profilePicture && user.profilePicture.startsWith(user._id.toString())) {
            try {
                await deleteFromS3(user.profilePicture);
            } catch (err) {
                console.error('Failed to delete old avatar:', err);
            }
        }

        // Upload new avatar
        const s3Key = `${req.user._id}/avatar-${Date.now()}-${file.originalname}`;
        await uploadToS3(s3Key, file.buffer, file.mimetype);

        user.profilePicture = s3Key;
        await user.save();

        const signedUrl = await getSignedS3Url(s3Key);

        logActivityAsync(req.user._id.toString(), 'avatar_update', 'user', req.user._id.toString(), user.email);

        res.json({ message: 'Avatar updated', profilePicture: signedUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Failed to upload avatar' });
    }
});

// DELETE /api/users/delete
router.delete('/delete', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // TODO: Delete all user files from S3 and database
        await User.findByIdAndDelete(req.user._id);

        res.clearCookie('auth_token', { path: '/' });
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Failed to delete account' });
    }
});

module.exports = router;
