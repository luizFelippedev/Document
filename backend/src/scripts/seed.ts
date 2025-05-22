// 4.5 - src/scripts/seed.ts - CORREÇÃO DE IMPORTS
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

dotenv.config();

// ✅ IMPORTS CORRIGIDOS
import User from '../api/models/user.model';
import Project from '../api/models/project.model';
import Certificate from '../api/models/certificate.model';
import Notification from '../api/models/notification.model';
import { connectDB } from '../config/db';

// Resto do código do seed permanece igual...

// 4.6 - src/api/models/user.model.ts - CORREÇÃO COMPLETA
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'manager';
  avatar?: string;
  bio?: string;
  company?: string;
  position?: string;
  verified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  active: boolean;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  getPublicProfile(): Partial<IUser>;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findActiveUsers(): Promise<IUser[]>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'manager'],
    default: 'user',
  },
  avatar: String,
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  company: {
    type: String,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
  },
  position: {
    type: String,
    maxlength: [100, 'Position cannot exceed 100 characters'],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  active: {
    type: Boolean,
    default: true,
  },
  skills: [String],
}, {
  timestamps: true,
});

UserSchema.index({ email: 1, active: 1 });
UserSchema.index({ role: 1, active: 1 });

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
};

UserSchema.methods.generateVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

UserSchema.methods.generatePasswordResetToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  return token;
};

UserSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 60 * 60 * 1000;
  
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= maxAttempts && !this.isLocked()) {
      this.lockUntil = new Date(Date.now() + lockTime);
    }
  }
  
  await this.save();
};

UserSchema.methods.getPublicProfile = function(): Partial<IUser> {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar,
    bio: this.bio,
    company: this.company,
    position: this.position,
    skills: this.skills,
    createdAt: this.createdAt,
  };
};

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ active: true });
};

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);
export default User;