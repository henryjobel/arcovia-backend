import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_STATUS } from '../../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    avatar: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },

    passwordHash: { type: String, select: false },

    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    extraPermissions: { type: [String], default: [] },
    deniedPermissions: { type: [String], default: [] },

    status: { type: String, enum: USER_STATUS, default: 'active', index: true },
    emailVerifiedAt: Date,

    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      recoveryCodes: { type: [String], select: false, default: [] }, // sha256 hashes
    },

    /** Bump to instantly invalidate every outstanding access token. */
    tokenVersion: { type: Number, default: 0 },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLoginAt: Date,
    lastLoginIp: String,

    /** Public author profile (blog byline, team pages). */
    designation: String,
    bio: { type: Map, of: String, default: undefined },

    meta: mongoose.Schema.Types.Mixed,
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ name: 'text', email: 'text' });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.isLocked = function () {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

export const User = mongoose.model('User', userSchema);
