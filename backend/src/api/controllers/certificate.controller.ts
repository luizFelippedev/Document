import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import Certificate, { ICertificate } from '../models/certificate.model';
import User from '../models/user.model';
import Project from '../models/project.model';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../core/error';
import { sendSuccess, sendCreated, sendNoContent, getPaginationData } from '../../core/responses';
import { deleteFile } from '../middleware/upload';
import { cacheGet, cacheSet, cacheDelete } from '../../config/redis';
import logger from '../../config/logger';
import { createNotification } from '../services/notification.service';
import { sendEmail } from '../../utils/email';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';

/**
 * @desc    Create a new certificate
 * @route   POST /api/certificates
 * @access  Private (Issuer)
 */
export const createCertificate = asyncHandler(async (
  req: AuthRequest,
  res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const {
    title,
    description,
    recipientId,
    projectId,
    expiryDate,
    skillsValidated,
    templateId,
    metadata,
  } = req.body;
  
  // Check if user has permission to issue certificates
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    throw new ForbiddenError('You do not have permission to issue certificates');
  }
  
  // Validate recipient
  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    throw new BadRequestError('Invalid recipient ID');
  }
  
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new NotFoundError('Recipient not found');
  }
  
  // Validate project if provided
  let project;
  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    // Check if user is associated with the project
    if (project.owner.toString() !== req.user._id.toString() && 
        !project.collaborators.some(id => id.toString() === req.user?._id.toString()) &&
        req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to issue certificates for this project');
    }
    
    // Check if recipient is associated with the project
    if (project.owner.toString() !== recipientId && 
        !project.collaborators.some(id => id.toString() === recipientId)) {
      throw new BadRequestError('Recipient is not associated with this project');
    }
  }
  
  // Create certificate
  const certificate = new Certificate({
    title,
    description,
    recipient: recipientId,
    issuer: req.user._id,
    project: projectId,
    expiryDate: expiryDate || undefined,
    skillsValidated: skillsValidated || [],
    templateId: templateId || undefined,
    metadata: metadata || {},
    status: 'draft',
  });
  
  // Generate verification code and URL
  certificate.generateVerificationCode();
  
  // Set certificate number if not already set
  if (!certificate.certificateNumber) {
    const timestamp = Date.now().toString().substring(4);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    certificate.certificateNumber = `CERT-${timestamp}-${random}`;
  }
  
  // Generate QR code for verification
  const qrCodeDir = path.join(process.cwd(), 'uploads', 'certificates', 'images');
  if (!fs.existsSync(qrCodeDir)) {
    fs.mkdirSync(qrCodeDir, { recursive: true });
  }
  
  const qrCodePath = path.join(qrCodeDir, `${certificate.verificationCode}.png`);
  
  await QRCode.toFile(qrCodePath, certificate.verificationUrl, {
    errorCorrectionLevel: 'H',
    width: 500,
    margin: 1,
  });
  
  // Save QR code path to certificate
  certificate.imageUrl = `uploads/certificates/images/${certificate.verificationCode}.png`;
  
  // Handle file upload if there's a file
  if (req.file) {
    certificate.fileUrl = req.file.path.replace(/\\/g, '/');
  }
  
  // Save certificate
  await certificate.save();
  
  // Notify recipient
  await createNotification({
    recipient: new Types.ObjectId(recipient._id.toString()),
    sender: req.user._id,
    type: 'success',
    title: 'New Certificate',
    message: `You've received a certificate: ${certificate.title}`,
    link: `/certificates/${certificate._id}`,
    entity: {
      type: 'certificate',
      id: certificate._id,
    },
  });
  
  // Send email notification
  await sendEmail({
    to: recipient.email,
    subject: 'You have received a new certificate',
    template: 'certificate-issued',
    data: {
      firstName: recipient.firstName,
      certificateTitle: certificate.title,
      issuerName: `${req.user.firstName} ${req.user.lastName}`,
      viewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/${certificate._id}`,
      verificationUrl: certificate.verificationUrl,
    },
  });
  
  // If status is not 'draft', update recipient's skills
  if (certificate.status === 'issued' && skillsValidated && skillsValidated.length > 0) {
    // Add validated skills to recipient's skills if they don't already have them
    const existingSkills = new Set(recipient.skills);
    const newSkills = skillsValidated.filter((skill: string) => !existingSkills.has(skill));
    
    if (newSkills.length > 0) {
      await User.updateOne(
        { _id: recipientId },
        { $addToSet: { skills: { $each: newSkills } } }
      );
    }
  }
  
  sendCreated(res, { certificate }, 'Certificate created successfully');
});

/**
 * @desc    Get all certificates (for issuers or admins)
 * @route   GET /api/certificates
 * @access  Private (Issuer, Admin)
 */
export const getCertificates = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Only issuer or admin can see all certificates
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    throw new ForbiddenError('You do not have permission to view all certificates');
  }
  
  const {
    page = 1,
    limit = 10,
    status,
    recipient,
    project,
    search,
    sortBy = 'issueDate',
    sortOrder = 'desc',
  } = req.query;
  
  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  // Build query
  const query: any = {};
  
  // Filter by issuer if not admin
  if (req.user.role !== 'admin') {
    query.issuer = req.user._id;
  }
  
  // Apply filters
  if (status) {
    query.status = status;
  }
  
  if (recipient && mongoose.Types.ObjectId.isValid(recipient as string)) {
    query.recipient = recipient;
  }
  
  if (project && mongoose.Types.ObjectId.isValid(project as string)) {
    query.project = project;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { certificateNumber: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Cache key based on query and user
  const cacheKey = `certificates:${req.user._id}:${JSON.stringify(req.query)}`;
  
  // Try to get from cache first
  const cachedResult = await cacheGet(cacheKey);
  if (cachedResult && typeof cachedResult === 'object' && 'data' in cachedResult) {
    return sendSuccess(res, (cachedResult as any).data, 'Certificates retrieved from cache', 200, (cachedResult as any).meta, (cachedResult as any).links);
  }
  
  // Determine sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Count total documents for pagination
  const totalCertificates = await Certificate.countDocuments(query);
  
  // Get certificates with pagination
  const certificates = await Certificate.find(query)
    .sort(sortOptions)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('recipient', 'firstName lastName email avatar')
    .populate('issuer', 'firstName lastName email')
    .populate('project', 'name description');
  
  // Calculate pagination data
  const baseUrl = `${req.protocol}://${req.get('host')}/api/certificates`;
  const { meta, links } = getPaginationData(totalCertificates, pageNum, limitNum, baseUrl);
  
  // Cache the result for 5 minutes
  const result = { data: { certificates }, meta, links };
  await cacheSet(cacheKey, result, 300);
  
  sendSuccess(res, { certificates }, 'Certificates retrieved successfully', 200, meta, links);
});

/**
 * @desc    Get a certificate by ID
 * @route   GET /api/certificates/:id
 * @access  Private
 */
export const getCertificateById = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate certificate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid certificate ID');
  }
  
  // Cache key
  const cacheKey = `certificate:${id}`;
  
  // Try to get from cache first
  const cachedCertificate = await cacheGet(cacheKey);
  if (cachedCertificate) {
    // Check if user has access to the certificate
    const certificate = cachedCertificate as ICertificate;
    
    if (
      certificate.recipient.toString() !== req.user._id.toString() && 
      certificate.issuer.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && 
      req.user.role !== 'manager'
    ) {
      throw new ForbiddenError('You do not have access to this certificate');
    }
    
    return sendSuccess(res, { certificate }, 'Certificate retrieved from cache');
  }
  
  // Find certificate
  const certificate = await Certificate.findById(id)
    .populate('recipient', 'firstName lastName email avatar')
    .populate('issuer', 'firstName lastName email avatar')
    .populate('project', 'name description owner');
  
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  
  // Check if user has access to the certificate
  if (
    certificate.recipient.toString() !== req.user._id.toString() && 
    certificate.issuer.toString() !== req.user._id.toString() && 
    req.user.role !== 'admin' && 
    req.user.role !== 'manager'
  ) {
    throw new ForbiddenError('You do not have access to this certificate');
  }
  
  // Cache the certificate for 5 minutes
  await cacheSet(cacheKey, certificate, 300);
  
  sendSuccess(res, { certificate }, 'Certificate retrieved successfully');
});

/**
 * @desc    Update a certificate
 * @route   PUT /api/certificates/:id
 * @access  Private (Issuer)
 */
export const updateCertificate = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate certificate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid certificate ID');
  }
  
  // Find certificate
  const certificate = await Certificate.findById(id);
  
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  
  // Check if user is issuer or admin
  if (certificate.issuer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to update this certificate');
  }
  
  // Check if certificate can be updated
  if (certificate.status === 'revoked') {
    throw new BadRequestError('Revoked certificates cannot be updated');
  }
  
  const {
    title,
    description,
    expiryDate,
    skillsValidated,
    status,
    metadata,
  } = req.body;
  
  // Update certificate fields
  if (title) certificate.title = title;
  if (description) certificate.description = description;
  if (expiryDate !== undefined) certificate.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
  if (skillsValidated) certificate.skillsValidated = skillsValidated;
  if (metadata) certificate.metadata = { ...certificate.metadata, ...metadata };
  
  // Handle status change
  if (status && status !== certificate.status) {
    if (status === 'issued' && certificate.status === 'draft') {
      certificate.status = 'issued';
      certificate.issueDate = new Date();
      
      // Notify recipient
      await createNotification({
        recipient: new Types.ObjectId(certificate.recipient.toString()),
        sender: req.user._id,
        type: 'success',
        title: 'Certificate Issued',
        message: `Your certificate "${certificate.title}" has been issued`,
        link: `/certificates/${certificate._id}`,
        entity: {
          type: 'certificate',
          id: certificate._id,
        },
      });
      
      // Update recipient's skills
      if (certificate.skillsValidated && certificate.skillsValidated.length > 0) {
        await User.updateOne(
          { _id: certificate.recipient },
          { $addToSet: { skills: { $each: certificate.skillsValidated } } }
        );
      }
      
      // Send email notification
      const recipient = await User.findById(certificate.recipient);
      if (recipient) {
        await sendEmail({
          to: recipient.email,
          subject: 'Your Certificate Has Been Issued',
          template: 'certificate-issued',
          data: {
            firstName: recipient.firstName,
            certificateTitle: certificate.title,
            issuerName: `${req.user.firstName} ${req.user.lastName}`,
            viewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/${certificate._id}`,
            verificationUrl: certificate.verificationUrl,
          },
        });
      }
    } else if (status === 'revoked') {
      await certificate.revoke();
      
      // Notify recipient
      await createNotification({
        recipient: new Types.ObjectId(certificate.recipient.toString()),
        sender: req.user._id,
        type: 'warning',
        title: 'Certificate Revoked',
        message: `Your certificate "${certificate.title}" has been revoked`,
        link: `/certificates/${certificate._id}`,
        entity: {
          type: 'certificate',
          id: certificate._id,
        },
      });
    } else {
      certificate.status = status;
    }
  }
  
  // Handle file upload if there's a file
  if (req.file) {
    // Delete old file if exists
    if (certificate.fileUrl) {
      await deleteFile(certificate.fileUrl);
    }
    
    certificate.fileUrl = req.file.path.replace(/\\/g, '/');
  }
  
  // Save certificate
  await certificate.save();
  
  // Clear certificate cache
  await cacheDelete(`certificate:${id}`);
  await cacheDelete(`certificates:${req.user._id}:*`);
  
  sendSuccess(res, { certificate }, 'Certificate updated successfully');
});

/**
 * @desc    Delete a certificate
 * @route   DELETE /api/certificates/:id
 * @access  Private (Issuer, Admin)
 */
export const deleteCertificate = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate certificate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid certificate ID');
  }
  
  // Find certificate
  const certificate = await Certificate.findById(id);
  
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  
  // Check if user is issuer or admin
  if (certificate.issuer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to delete this certificate');
  }
  
  // Delete associated files
  if (certificate.imageUrl) {
    await deleteFile(certificate.imageUrl);
  }
  
  if (certificate.fileUrl) {
    await deleteFile(certificate.fileUrl);
  }
  
  // Delete certificate
  await Certificate.deleteOne({ _id: id });
  
  // Clear certificate cache
  await cacheDelete(`certificate:${id}`);
  await cacheDelete(`certificates:${req.user._id}:*`);
  
  // Notify recipient
  await createNotification({
    recipient: new Types.ObjectId(certificate.recipient.toString()),
    sender: req.user._id,
    type: 'info',
    title: 'Certificate Deleted',
    message: `A certificate "${certificate.title}" has been deleted`,
    entity: {
      type: 'certificate',
      id: certificate._id,
    },
  });
  
  sendNoContent(res);
});

/**
 * @desc    Verify a certificate
 * @route   GET /api/certificates/verify/:code
 * @access  Public
 */
export const verifyCertificate = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code } = req.params;
  
  if (!code) {
    throw new BadRequestError('Verification code is required');
  }
  
  // Find certificate by verification code
  const certificate = await Certificate.findOne({ verificationCode: code })
    .populate('recipient', 'firstName lastName email')
    .populate('issuer', 'firstName lastName email')
    .populate('project', 'name description');
  
  if (!certificate) {
    throw new NotFoundError('Certificate not found or invalid verification code');
  }
  
  // Check if certificate is valid
  const isValid = certificate.isValid();
  
  sendSuccess(res, {
    certificate: {
      id: certificate._id,
      title: certificate.title,
      description: certificate.description,
      recipient: certificate.recipient,
      issuer: certificate.issuer,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      certificateNumber: certificate.certificateNumber,
      status: certificate.status,
      skillsValidated: certificate.skillsValidated,
      project: certificate.project,
    },
    isValid,
    verificationDate: new Date(),
  }, 'Certificate verification completed');
});

/**
 * @desc    Download certificate file
 * @route   GET /api/certificates/:id/download
 * @access  Private
 */
export const downloadCertificate = asyncHandler(async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  const { id } = req.params;
  
  // Validate certificate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid certificate ID');
  }
  
  // Find certificate
  const certificate = await Certificate.findById(id);
  
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  
  // Check if user has access to the certificate
  if (
    certificate.recipient.toString() !== req.user._id.toString() && 
    certificate.issuer.toString() !== req.user._id.toString() && 
    req.user.role !== 'admin' && 
    req.user.role !== 'manager'
  ) {
    throw new ForbiddenError('You do not have access to this certificate');
  }
  
  // Check if certificate has a file
  if (!certificate.fileUrl) {
    throw new BadRequestError('Certificate does not have a downloadable file');
  }
  
  // Get file path
  const filePath = path.join(process.cwd(), certificate.fileUrl);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('Certificate file not found');
  }
  
  // Generate download filename
  const downloadFileName = `Certificate-${certificate.certificateNumber}${path.extname(certificate.fileUrl)}`;
  
  // Send file
  res.download(filePath, downloadFileName, (err) => {
    if (err) {
      logger.error(`Error downloading certificate: ${err}`);
      next(new Error('Error downloading certificate'));
    }
  });
});

/**
 * @desc    Bulk issue certificates
 * @route   POST /api/certificates/bulk
 * @access  Private (Issuer, Admin)
 */
export const bulkIssueCertificates = asyncHandler(async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // Check if user has permission to issue certificates
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    throw new ForbiddenError('You do not have permission to issue certificates');
  }
  
  const { 
    title, 
    description, 
    recipients, 
    projectId, 
    expiryDate, 
    skillsValidated,
    templateId 
  } = req.body;
  
  // Validate recipients
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new BadRequestError('Recipients list is required and must be an array');
  }
  
  // Validate project if provided
  let project;
  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new BadRequestError('Invalid project ID');
    }
    
    project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    // Check if user is associated with the project
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to issue certificates for this project');
    }
  }
  
  // Find all valid recipients
  const validRecipients = await User.find({
    _id: { $in: recipients },
    active: true,
  }).select('_id firstName lastName email');
  
  if (validRecipients.length === 0) {
    throw new BadRequestError('No valid recipients found');
  }
  
  // Create certificates for each recipient
  const certificates = [];
  const failed = [];
  
  for (const recipient of validRecipients) {
    try {
      // Create certificate
      const certificate = new Certificate({
        title,
        description,
        recipient: recipient._id,
        issuer: req.user._id,
        project: projectId,
        expiryDate: expiryDate || undefined,
        skillsValidated: skillsValidated || [],
        templateId: templateId || undefined,
        status: 'issued',
        issueDate: new Date(),
      });
      
      // Generate verification code and URL
      certificate.generateVerificationCode();
      
      // Set certificate number
      const timestamp = Date.now().toString().substring(4);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      certificate.certificateNumber = `CERT-${timestamp}-${random}`;
      
      // Generate QR code for verification
      const qrCodeDir = path.join(process.cwd(), 'uploads', 'certificates', 'images');
      if (!fs.existsSync(qrCodeDir)) {
        fs.mkdirSync(qrCodeDir, { recursive: true });
      }
      
      const qrCodePath = path.join(qrCodeDir, `${certificate.verificationCode}.png`);
      
      await QRCode.toFile(qrCodePath, certificate.verificationUrl, {
        errorCorrectionLevel: 'H',
        width: 500,
        margin: 1,
      });
      
      // Save QR code path to certificate
      certificate.imageUrl = `uploads/certificates/images/${certificate.verificationCode}.png`;
      
      // Save certificate
      await certificate.save();
      certificates.push(certificate);
      
      // Notify recipient
      await createNotification({
        recipient: new Types.ObjectId(recipient._id.toString()),
        sender: req.user._id,
        type: 'success',
        title: 'New Certificate',
        message: `You've received a certificate: ${certificate.title}`,
        link: `/certificates/${certificate._id}`,
        entity: {
          type: 'certificate',
          id: certificate._id,
        },
      });
      
      // Send email notification
      await sendEmail({
        to: recipient.email,
        subject: 'You have received a new certificate',
        template: 'certificate-issued',
        data: {
          firstName: recipient.firstName,
          certificateTitle: certificate.title,
          issuerName: `${req.user.firstName} ${req.user.lastName}`,
          viewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificates/${certificate._id}`,
          verificationUrl: certificate.verificationUrl,
        },
      });
      
      // Update recipient's skills
      if (skillsValidated && skillsValidated.length > 0) {
        await User.updateOne(
          { _id: recipient._id },
          { $addToSet: { skills: { $each: skillsValidated } } }
        );
      }
    } catch (error) {
      logger.error(`Error creating certificate for recipient ${recipient._id}: ${error}`);
      failed.push({
        id: recipient._id,
        name: `${recipient.firstName} ${recipient.lastName}`,
        error: (error as Error).message,
      });
    }
  }
  
  // Clear certificates cache
  await cacheDelete(`certificates:${req.user._id}:*`);
  
  sendSuccess(res, {
    success: certificates.length,
    failed: failed.length,
    failedDetails: failed.length > 0 ? failed : undefined,
    certificates: certificates.map(cert => ({
      id: cert._id,
      recipient: cert.recipient,
      certificateNumber: cert.certificateNumber,
    })),
  }, `Successfully issued ${certificates.length} certificates`);
});

export default {
  createCertificate,
  getCertificates,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  verifyCertificate,
  downloadCertificate,
  bulkIssueCertificates,
};