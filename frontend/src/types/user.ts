// frontend/src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    dribbble?: string;
    behance?: string;
  };
  role: 'user' | 'admin';
  skills?: string[];
  jobTitle?: string | null;
  company?: string | null;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  showOnlineStatus: boolean;
  showPublicEmail: boolean;
  showPublicLocation: boolean;
}

export interface UserStatistics {
  projectsCount: number;
  certificatesCount: number;
  skillsCount: number;
  completedProjectsCount: number;
  publicProjectsCount: number;
  publicCertificatesCount: number;
  profileViews: number;
  lastActive: string;
}