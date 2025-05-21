// frontend/src/types/project.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  images?: string[];
  skills: string[];
  demoUrl?: string | null;
  repoUrl?: string | null;
  category?: string | null;
  completed: boolean;
  startDate?: string | null;
  endDate?: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  skills: string[];
  demoUrl?: string;
  repoUrl?: string;
  category?: string;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
}

export interface ProjectStatistics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export interface ProjectFilter {
  search?: string;
  skills?: string[];
  completed?: boolean;
  category?: string;
  sortBy?: 'newest' | 'oldest' | 'a-z' | 'z-a';
}
