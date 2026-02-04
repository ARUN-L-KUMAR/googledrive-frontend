const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    generateEmailVerificationToken,
    generatePasswordResetToken,
    verifyToken,
};
