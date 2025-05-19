import { Router } from 'express';
import certificateController from '../controllers/certificate.controller';
import { authenticate, authorize, refreshToken, requireVerifiedEmail } from '../middleware/auth';
import { createUploadMiddleware, handleUploadErrors } from '../middleware/upload';

const router = Router();

/**
 * @route   POST /api/certificates
 * @desc    Create a new certificate
 * @access  Private (Issuer, Admin)
 */
router.post(
  '/',
  authenticate,
  requireVerifiedEmail,
  authorize(['admin', 'manager']),
  refreshToken,
  createUploadMiddleware('certificate'),
  handleUploadErrors,
  certificateController.createCertificate
);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates (for issuers or admins)
 * @access  Private (Issuer, Admin)
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  refreshToken,
  certificateController.getCertificates
);

/**
 * @route   GET /api/certificates/:id
 * @desc    Get a certificate by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  refreshToken,
  certificateController.getCertificateById
);

/**
 * @route   PUT /api/certificates/:id
 * @desc    Update a certificate
 * @access  Private (Issuer, Admin)
 */
router.put(
  '/:id',
  authenticate,
  requireVerifiedEmail,
  refreshToken,
  createUploadMiddleware('certificate'),
  handleUploadErrors,
  certificateController.updateCertificate
);

/**
 * @route   DELETE /api/certificates/:id
 * @desc    Delete a certificate
 * @access  Private (Issuer, Admin)
 */
router.delete(
  '/:id',
  authenticate,
  refreshToken,
  certificateController.deleteCertificate
);

/**
 * @route   GET /api/certificates/verify/:code
 * @desc    Verify a certificate
 * @access  Public
 */
router.get(
  '/verify/:code',
  certificateController.verifyCertificate
);

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download certificate file
 * @access  Private
 */
router.get(
  '/:id/download',
  authenticate,
  refreshToken,
  certificateController.downloadCertificate
);

/**
 * @route   POST /api/certificates/bulk
 * @desc    Bulk issue certificates
 * @access  Private (Issuer, Admin)
 */
router.post(
  '/bulk',
  authenticate,
  requireVerifiedEmail,
  authorize(['admin', 'manager']),
  refreshToken,
  certificateController.bulkIssueCertificates
);

export default router;