// frontend/src/utils/validation.ts
import { z } from 'zod';

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  phone: /^\+?[0-9]{10,15}$/,
};

// Reusable validation schemas
export const validationSchemas = {
  // Auth schemas
  login: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  }),

  register: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),
      email: z.string().email('Please enter a valid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(
          /[^A-Za-z0-9]/,
          'Password must contain at least one special character',
        ),
      confirmPassword: z.string(),
      acceptTerms: z.boolean().refine((value) => value === true, {
        message: 'You must accept the terms and conditions',
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),

  // User schemas
  profile: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    bio: z
      .string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional()
      .nullable(),
    location: z
      .string()
      .max(100, 'Location cannot exceed 100 characters')
      .optional()
      .nullable(),
    website: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .nullable()
      .or(z.literal('')),
    jobTitle: z
      .string()
      .max(100, 'Job title cannot exceed 100 characters')
      .optional()
      .nullable(),
    company: z
      .string()
      .max(100, 'Company cannot exceed 100 characters')
      .optional()
      .nullable(),
  }),

  // Project schemas
  project: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title cannot exceed 100 characters'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters'),
    skills: z.array(z.string()).min(1, 'Select at least one skill'),
    demoUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
    repoUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
    completed: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isPublic: z.boolean().optional(),
    category: z.string().optional(),
  }),

  // Certificate schemas
  certificate: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title cannot exceed 100 characters'),
    issuer: z.string().min(1, 'Issuer is required'),
    issueDate: z.string().min(1, 'Issue date is required'),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z
      .string()
      .url('Enter a valid URL')
      .or(z.literal(''))
      .optional(),
    description: z.string().optional(),
    skills: z.array(z.string()).min(1, 'Select at least one skill'),
    isPublic: z.boolean().optional(),
    category: z.string().optional(),
  }),
};

// Validation helper functions
export const validators = {
  isValidEmail: (email: string): boolean => patterns.email.test(email),
  isStrongPassword: (password: string): boolean =>
    patterns.password.test(password),
  isValidUrl: (url: string): boolean => patterns.url.test(url),
  isValidPhone: (phone: string): boolean => patterns.phone.test(phone),

  getPasswordStrength: (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    // Length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character types
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Normalize to 0-100
    return Math.min(100, (strength / 6) * 100);
  },
};

// Custom errors handling
export class ValidationError extends Error {
  errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export const validateForm = async <T>(
  schema: z.ZodType<T>,
  data: unknown,
): Promise<{ success: boolean; data?: T; errors?: Record<string, string> }> => {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors };
    }
    throw error;
  }
};
