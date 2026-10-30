import nodemailer from 'nodemailer';
import { env } from './env';
import { internalError } from './errors';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_PORT === 465,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * Sends a 6-digit OTP email with plain visible text code.
 * Fails fast if SMTP connection times out.
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: 'email_verify' | 'password_reset'
): Promise<void> {
  const isVerify = purpose === 'email_verify';
  const subject = isVerify
    ? 'Verify your CV Maker account'
    : 'Reset your CV Maker password';
  const actionText = isVerify
    ? 'verify your email address and activate your account'
    : 'reset your account password';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">${subject}</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Use the verification code below to ${actionText}:</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0;">
        <span style="font-family: monospace, Courier; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0284c7;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">This code will expire in ${env.OTP_EXPIRY_MINUTES} minutes. If you did not request this, please disregard this email.</p>
    </div>
  `;

  const text = `${subject}\n\nYour 6-digit verification code is: ${code}\n\nThis code will expire in ${env.OTP_EXPIRY_MINUTES} minutes. If you did not request this, please ignore this email.`;

  try {
    const fromAddress =
      env.SMTP_FROM && !env.SMTP_FROM.includes('.local')
        ? env.SMTP_FROM
        : env.SMTP_USER
          ? `"CV Maker" <${env.SMTP_USER}>`
          : 'noreply@cvmaker.local';

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });
  } catch (error: any) {
    console.error('SMTP Send Error:', error.message || error);
    throw internalError('Failed to send email', 'EMAIL_SEND_FAILED');
  }
}
