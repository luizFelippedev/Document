import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import { htmlToText } from 'html-to-text';
import logger from '../config/logger';

// Email options interface
interface EmailOptions {
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
}

// Cached templates
const templateCache: Record<string, handlebars.TemplateDelegate> = {};

// Email transporter
let transporter: nodemailer.Transporter;

/**
 * Initialize email service
 */
export const initializeEmailService = (): void => {
  // Determine environment to use appropriate transporter
  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SMTP)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password',
      },
    });
  } else {
    // Development email service (e.g., Ethereal)
    nodemailer.createTestAccount().then((testAccount) => {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info(`Ethereal email account created: ${testAccount.user}`);
    }).catch((error) => {
      logger.error(`Error creating test email account: ${error}`);
    });
  }
};

/**
 * Load email template
 * @param templateName Name of the template file (without extension)
 * @returns Compiled Handlebars template
 */
const loadTemplate = (templateName: string): handlebars.TemplateDelegate => {
  // Check if template is already cached
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }
  
  // Otherwise, load from file
  const templatePath = path.join(
    process.cwd(),
    'src',
    'templates',
    'emails',
    `${templateName}.html`
  );
  
  try {
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    
    // Cache for future use
    templateCache[templateName] = template;
    
    return template;
  } catch (error) {
    logger.error(`Error loading email template '${templateName}': ${error}`);
    throw new Error(`Email template '${templateName}' not found`);
  }
};

/**
 * Register Handlebars helpers
 */
const registerHelpers = (): void => {
  handlebars.registerHelper('formatDate', function(date: Date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });
  
  handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });
  
  handlebars.registerHelper('uppercase', function(str: string) {
    return str.toUpperCase();
  });
};

// Register helpers
registerHelpers();

/**
 * Send an email
 * @param options Email options
 * @returns Sent email info
 */
export const sendEmail = async (options: EmailOptions): Promise<any> => {
  try {
    // Initialize email service if not already done
    if (!transporter) {
      initializeEmailService();
    }
    
    // Prepare email content from template
    let html: string | undefined;
    let text: string | undefined;
    
    if (options.template) {
      const template = loadTemplate(options.template);
      const data = options.data || {};
      
      // Add default data available to all templates
      const templateData = {
        ...data,
        appName: process.env.APP_NAME || 'Your App',
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        currentYear: new Date().getFullYear(),
      };
      
      html = template(templateData);
      text = htmlToText(html, {
        wordwrap: 130,
        selectors: [
          { selector: 'img', format: 'skip' },
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        ],
      });
    } else if (options.html) {
      html = options.html;
      text = options.text || htmlToText(html);
    } else if (options.text) {
      text = options.text;
    } else {
      throw new Error('Email content is required (template, html, or text)');
    }
    
    // Prepare email message
    const message: nodemailer.SendMailOptions = {
      from: options.from || `${process.env.EMAIL_FROM_NAME || 'Your App'} <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      to: options.to,
      subject: options.subject,
      html,
      text,
      attachments: options.attachments || [],
    };
    
    // Add CC and BCC if provided
    if (options.cc) message.cc = options.cc;
    if (options.bcc) message.bcc = options.bcc;
    
    // Send email
    const info = await transporter.sendMail(message);
    
    // Log preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error}`);
    throw error;
  }
};

/**
 * Send a test email
 * @param to Recipient email address
 * @returns Sent email info
 */
export const sendTestEmail = async (to: string): Promise<any> => {
  try {
    return await sendEmail({
      to,
      subject: 'Test Email',
      template: 'test-email',
      data: {
        name: 'Test User',
        testMessage: 'This is a test email to verify that the email service is working properly.',
      },
    });
  } catch (error) {
    logger.error(`Error sending test email: ${error}`);
    throw error;
  }
};

/**
 * Queue an email to be sent asynchronously
 * This function adds the email to a queue to be processed by a background job
 * @param options Email options
 */
export const queueEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Add email to queue using email processor
    const emailProcessor = require('../jobs/email.processor').default;
    await emailProcessor.addEmailToQueue(options);
    
    logger.info(`Email to ${options.to} queued successfully`);
  } catch (error) {
    logger.error(`Error queueing email: ${error}`);
    throw error;
  }
};

export default {
  initializeEmailService,
  sendEmail,
  sendTestEmail,
  queueEmail,
};