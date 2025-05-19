import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
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
  createdAt: Date;
  updatedAt: Date;
  loginAttempts: number;
  lockUntil?: Date;
  active: boolean;
  skills: string[];
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  isLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'manager'],
      default: 'user',
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    company: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
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
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: Date,
    active: {
      type: Boolean,
      default: true,
    },
    skills: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Create index for email
UserSchema.index({ email: 1 });

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    // Hash the password using the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    (process.env.JWT_SECRET || 'your-secret-key') as Secret,
    {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    } as SignOptions
  );
};

// Generate verification token
UserSchema.methods.generateVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 24 hours
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return token;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 1 hour
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  return token;
};

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  // Check if lockUntil exists and if the current time is less than lockUntil
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If previous lock has expired, restart count
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    // Increment login attempts
    this.loginAttempts += 1;
    
    // Lock the account if we've reached max attempts (5)
    if (this.loginAttempts >= 5) {
      // Lock the account for 1 hour
      this.lockUntil = new Date(Date.now() + 60 * 60 * 1000);
    }
  }
  
  await this.save();
};

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;