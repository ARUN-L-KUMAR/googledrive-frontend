const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === 'local';
            },
            minlength: 6,
            select: false,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
        storageUsed: {
            type: Number,
            default: 0,
        },
        storageLimit: {
            type: Number,
            default: 5 * 1024 * 1024 * 1024, // 5GB in bytes
        },
    },
    { timestamps: true }
);

// Hash password before saving (only for local auth users)
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
