const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, generateEmailVerificationToken, generatePasswordResetToken } = require('../utils/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { logActivityAsync } = require('../utils/activity');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const emailVerificationToken = generateEmailVerificationToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            authProvider: 'local',
            emailVerificationToken,
            emailVerificationExpires,
        });

        await user.save();

        try {
            await sendVerificationEmail(email, emailVerificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        const token = generateToken(user);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.emailVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token required' });
        }

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        const authToken = generateToken(user);

        res.cookie('auth_token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Verification failed' });
    }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If an account exists, a verification email will be sent' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        const emailVerificationToken = generateEmailVerificationToken();
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(email, emailVerificationToken);

        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Failed to resend verification email' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If an account exists, a password reset link will be sent' });
        }

        const passwordResetToken = generatePasswordResetToken();
        user.passwordResetToken = passwordResetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        try {
            await sendPasswordResetEmail(email, passwordResetToken);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            return res.status(500).json({ message: 'Failed to send reset email' });
        }

        res.json({ message: 'If an account exists, a password reset link will be sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to process request' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password required' });
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        logActivityAsync(user._id.toString(), 'password_change', 'user', user._id.toString(), user.email);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Password reset failed' });
    }
});

// GET /api/auth/google
router.get('/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.FRONTEND_URL + '/api/auth/google/callback')}` +
        `&response_type=code` +
        `&scope=email%20profile` +
        `&access_type=offline`;

    res.redirect(googleAuthUrl);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=No authorization code`);
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.FRONTEND_URL}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=Failed to get access token`);
        }

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userInfoResponse.json();

        // Find or create user
        let user = await User.findOne({ googleId: googleUser.id });

        if (!user) {
            user = await User.findOne({ email: googleUser.email });
            if (user) {
                user.googleId = googleUser.id;
                user.authProvider = 'google';
                user.emailVerified = true;
                if (googleUser.picture) {
                    user.profilePicture = googleUser.picture;
                }
                await user.save();
            } else {
                user = new User({
                    email: googleUser.email,
                    firstName: googleUser.given_name || 'User',
                    lastName: googleUser.family_name || '',
                    googleId: googleUser.id,
                    authProvider: 'google',
                    emailVerified: true,
                    profilePicture: googleUser.picture || null,
                });
                await user.save();
            }
        }

        const token = generateToken(user);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
    }
});

module.exports = router;
