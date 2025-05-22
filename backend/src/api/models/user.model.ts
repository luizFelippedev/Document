import mongoose, { Document, Schema, Model } from 'mongoose';
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
  
  // Métodos
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  getPublicProfile(): Partial<IUser>;
}

// Interface para métodos estáticos
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findActiveUsers(): Promise<IUser[]>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [8, 'Senha deve ter pelo menos 8 caracteres'],
      select: false,
      validate: {
        validator: function(password: string) {
          // Validar força da senha
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
        },
        message: 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
      }
    },
    firstName: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      maxlength: [50, 'Nome não pode exceder 50 caracteres'],
    },
    lastName: {
      type: String,
      required: [true, 'Sobrenome é obrigatório'],
      trim: true,
      maxlength: [50, 'Sobrenome não pode exceder 50 caracteres'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user', 'manager'],
        message: 'Role deve ser: admin, user ou manager'
      },
      default: 'user',
    },
    avatar: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true;
          return /^(uploads\/|https?:\/\/)/.test(v);
        },
        message: 'Avatar deve ser um caminho válido'
      }
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio não pode exceder 500 caracteres'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Nome da empresa não pode exceder 100 caracteres'],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, 'Cargo não pode exceder 100 caracteres'],
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
      index: true,
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
      max: 10,
    },
    lockUntil: {
      type: Date,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    skills: [{
      type: String,
      trim: true,
      maxlength: [50, 'Skill não pode exceder 50 caracteres'],
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.twoFactorSecret;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Índices compostos
UserSchema.index({ email: 1, active: 1 });
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lockUntil: 1, loginAttempts: 1 });

// Hash da senha antes de salvar
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Middleware para limpar tokens expirados
UserSchema.pre<IUser>('save', function (next) {
  // Limpar token de verificação expirado
  if (this.verificationExpires && this.verificationExpires < new Date()) {
    this.verificationToken = undefined;
    this.verificationExpires = undefined;
  }
  
  // Limpar token de reset expirado
  if (this.resetPasswordExpires && this.resetPasswordExpires < new Date()) {
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;
  }
  
  next();
});

// Comparar senha
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error('Erro ao verificar senha');
  }
};

// Gerar token JWT
UserSchema.methods.generateAuthToken = function (): string {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    verified: this.verified,
  };
  
  return jwt.sign(
    payload,
    (process.env.JWT_SECRET || 'default-secret') as Secret,
    {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
      issuer: 'portfolio-app',
      audience: 'portfolio-users',
    } as SignOptions
  );
};

// Gerar token de verificação
UserSchema.methods.generateVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  
  return token;
};

// Gerar token de reset de senha
UserSchema.methods.generatePasswordResetToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  
  return token;
};

// Verificar se conta está bloqueada
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Incrementar tentativas de login
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 60 * 60 * 1000; // 1 hora
  
  // Se o bloqueio expirou, resetar tentativas
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    
    // Bloquear conta se excedeu tentativas
    if (this.loginAttempts >= maxAttempts && !this.isLocked()) {
      this.lockUntil = new Date(Date.now() + lockTime);
    }
  }
  
  await this.save();
};

// Perfil público
UserSchema.methods.getPublicProfile = function (): Partial<IUser> {
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

// Métodos estáticos
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ active: true });
};

// Virtual para nome completo
UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;