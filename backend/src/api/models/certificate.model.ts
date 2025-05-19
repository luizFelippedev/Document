import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface ICertificate extends Document {
  title: string;
  description: string;
  recipient: Schema.Types.ObjectId;
  issuer: Schema.Types.ObjectId;
  issueDate: Date;
  expiryDate?: Date;
  templateId?: string;
  certificateNumber: string;
  status: 'draft' | 'issued' | 'revoked' | 'expired';
  skillsValidated: string[];
  imageUrl?: string;
  fileUrl?: string;
  metadata: {
    [key: string]: any;
  };
  verificationCode: string;
  verificationUrl: string;
  project?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generateVerificationCode(): string;
  isValid(): boolean;
  revoke(): Promise<void>;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    title: {
      type: String,
      required: [true, 'Certificate title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Certificate description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Certificate recipient is required'],
    },
    issuer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Certificate issuer is required'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    templateId: {
      type: String,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'revoked', 'expired'],
      default: 'draft',
    },
    skillsValidated: [
      {
        type: String,
        trim: true,
      },
    ],
    imageUrl: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
CertificateSchema.index({ recipient: 1 });
CertificateSchema.index({ issuer: 1 });
CertificateSchema.index({ status: 1 });
CertificateSchema.index({ certificateNumber: 1 }, { unique: true });
CertificateSchema.index({ verificationCode: 1 }, { unique: true });
CertificateSchema.index({ 'skillsValidated': 1 });

// Generate a unique verification code
CertificateSchema.methods.generateVerificationCode = function (): string {
  const code = crypto.randomBytes(16).toString('hex');
  this.verificationCode = code;
  this.verificationUrl = `${process.env.FRONTEND_URL || 'https://your-app.com'}/verify/${code}`;
  return code;
};

// Check if certificate is valid
CertificateSchema.methods.isValid = function (): boolean {
  if (this.status === 'revoked') return false;
  if (this.status === 'expired') return false;
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired';
    this.save(); // Save the status change
    return false;
  }
  return this.status === 'issued';
};

// Revoke the certificate
CertificateSchema.methods.revoke = async function (): Promise<void> {
  this.status = 'revoked';
  await this.save();
};

// Generate certificate number before saving if not provided
CertificateSchema.pre<ICertificate>('save', function (next) {
  if (this.isNew) {
    // If no certificateNumber is provided, generate one
    if (!this.certificateNumber) {
      const timestamp = Date.now().toString().substring(4);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.certificateNumber = `CERT-${timestamp}-${random}`;
    }
    
    // If no verificationCode is provided, generate one
    if (!this.verificationCode) {
      this.generateVerificationCode();
    }
  }
  
  next();
});

// Post-save hook to check if the certificate is expired
CertificateSchema.post<ICertificate>('save', function (doc) {
  if (doc.expiryDate && new Date() > new Date(doc.expiryDate) && doc.status !== 'expired') {
    doc.status = 'expired';
    doc.save();
  }
});

const Certificate = mongoose.model<ICertificate>('Certificate', CertificateSchema);

export default Certificate;