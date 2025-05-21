// frontend/src/types/certificate.ts
export interface Certificate {
  id: string;
  title: string;
  description?: string | null;
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  thumbnail?: string | null;
  fileUrl?: string | null;
  images?: string[];
  skills: string[];
  category?: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateFormData {
  title: string;
  description?: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
  category?: string;
  isPublic: boolean;
}

export interface CertificateVerification {
  isValid: boolean;
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  holderName: string;
  credentialId: string;
  skills: string[];
  verified: boolean;
  verificationDate: string;
}

export interface CertificateFilter {
  search?: string;
  skills?: string[];
  issuer?: string;
  category?: string;
  expired?: boolean;
  sortBy?: 'newest' | 'oldest' | 'a-z' | 'z-a';
}
