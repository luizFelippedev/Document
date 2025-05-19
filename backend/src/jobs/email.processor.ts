import { Job } from 'bull';
import { sendEmail } from '../utils/email';
import logger from '../config/logger';
import { getEmailQueue } from './index';

// Email job data interface
interface EmailJobData {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  priority?: number;
}

/**
 * Process an email job
 * @param job Bull job object
 * @returns Result of processing
 */
export const processJob = async (job: Job<EmailJobData>): Promise<any> => {
  try {
    const { data } = job;
    
    // Update job progress
    await job.progress(50);
    
    // Send email
    const result = await sendEmail({
      to: data.to,
      subject: data.subject,
      template: data.template,
      html: data.html,
      text: data.text,
      data: data.data,
      attachments: data.attachments,
      from: data.from,
      cc: data.cc,
      bcc: data.bcc,
    });
    
    // Update job progress
    await job.progress(100);
    
    return {
      success: true,
      messageId: result.messageId,
      previewUrl: result.messageId ? result : null,
    };
  } catch (error) {
    logger.error(`Error processing email job: ${error}`);
    throw error;
  }
};

/**
 * Add an email to the queue
 * @param emailData Email job data
 * @returns Job ID
 */
export const addEmailToQueue = async (emailData: EmailJobData): Promise<string> => {
  try {
    const queue = getEmailQueue();
    
    const jobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000, // 1 second
      },
      removeOnComplete: true,
      removeOnFail: false,
    };
    
    // Add priority if specified
    if (emailData.priority) {
      Object.assign(jobOptions, { priority: emailData.priority });
    }
    
    const job = await queue.add(emailData, jobOptions);
    
    return job.id.toString();
  } catch (error) {
    logger.error(`Error adding email to queue: ${error}`);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param to Recipient email
 * @param firstName Recipient first name
 * @param resetUrl Password reset URL
 * @returns Job ID
 */
export const sendPasswordResetEmail = async (
  to: string,
  firstName: string,
  resetUrl: string
): Promise<string> => {
  return addEmailToQueue({
    to,
    subject: 'Password Reset Request',
    template: 'password-reset',
    data: {
      firstName,
      resetUrl,
      expiryHours: 1, // Token expires in 1 hour
    },
    priority: 1, // High priority
  });
};

/**
 * Send a welcome email
 * @param to Recipient email
 * @param firstName Recipient first name
 * @returns Job ID
 */
export const sendWelcomeEmail = async (
  to: string,
  firstName: string
): Promise<string> => {
  return addEmailToQueue({
    to,
    subject: 'Welcome to Our Platform',
    template: 'welcome',
    data: {
      firstName,
    },
  });
};

/**
 * Send a verification email
 * @param to Recipient email
 * @param firstName Recipient first name
 * @param verificationUrl Email verification URL
 * @returns Job ID
 */
export const sendVerificationEmail = async (
  to: string,
  firstName: string,
  verificationUrl: string
): Promise<string> => {
  return addEmailToQueue({
    to,
    subject: 'Please verify your email address',
    template: 'email-verification',
    data: {
      firstName,
      verificationUrl,
    },
    priority: 2, // Medium-high priority
  });
};

export default {
  processJob,
  addEmailToQueue,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
};