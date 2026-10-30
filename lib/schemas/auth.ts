import { z } from 'zod';

// Password policy: min 8 chars, at least 1 letter and 1 number
export const passwordPolicy = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: passwordPolicy,
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const otpPurposeEnum = z.enum(['email_verify', 'password_reset']);

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  code: z.string().regex(/^\d{6}$/, 'OTP code must be a 6-digit number'),
  purpose: otpPurposeEnum,
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  purpose: otpPurposeEnum,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordPolicy,
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim()
    .optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordPolicy,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password or confirmation is required'),
});
