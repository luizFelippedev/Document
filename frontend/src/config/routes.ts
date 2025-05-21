// frontend/src/config/routes.ts
export const ROUTES = {
  HOME: '/',
  DASHBOARD: {
    ROOT: '/dashboard',
    PROJECTS: '/projects',
    CERTIFICATES: '/certificates',
    PROFILE: '/profile',
    SETTINGS: '/profile/settings',
    ADMIN: {
      ROOT: '/admin/dashboard',
      USERS: '/admin/users',
      PROJECTS: '/admin/projects',
      CERTIFICATES: '/admin/certificates',
    },
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },
  HELP: '/help',
  DOCUMENTATION: '/documentation',
  PRIVACY: '/privacy',
  TERMS: '/terms',
};
