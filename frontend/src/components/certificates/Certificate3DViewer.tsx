// frontend/src/components/certificates/Certificate3DViewer.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { certificateService } from '@/services/certificate.service';
import { useNotification } from '@/hooks/useNotification';
import { ROUTES } from '@/config/routes';
import { Certificate } from '@/types/certificate';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Award,
  ExternalLink,
  AlertCircle,
  Calendar,
  Link as LinkIcon,
  Share2,
  Printer,
  Building,
  Check,
  FileCheck,
  Smartphone,
  Copy,
  QrCode,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import { QRCodeCanvas } from 'qrcode.react';

interface Certificate3DViewerProps {
  id: string;
}

export const Certificate3DViewer: React.FC<Certificate3DViewerProps> = ({
  id,
}) => {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSharedView, setShowSharedView] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [is3DMode, setIs3DMode] = useState(true);

  const router = useRouter();
  const { showToast } = useNotification();
  const certificateRef = useRef<HTMLDivElement>(null);

  // Motion values for 3D effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform the rotation based on mouse position
  const rotateX = useTransform(y, [-300, 300], [15, -15]);
  const rotateY = useTransform(x, [-300, 300], [-15, 15]);

  // Fetch certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const data = await certificateService.getCertificate(id);
        setCertificate(data);
      } catch (err: unknown) {
        setError(err.response?.data?.message || 'Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  // Generate share URL
  useEffect(() => {
    if (certificate) {
      const baseUrl = window.location.origin;
      const publicPath = `/certificates/public/${id}`;
      setShareUrl(`${baseUrl}${publicPath}`);
    }
  }, [certificate, id]);

  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DMode || !certificateRef.current) return;

    const bounds = certificateRef.current.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left - bounds.width / 2;
    const mouseY = e.clientY - bounds.top - bounds.height / 2;

    // Update motion values with some damping
    x.set(mouseX);
    y.set(mouseY);
  };

  // Reset rotation when mouse leaves
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Handle certificate deletion
  const handleDelete = async () => {
    try {
      await certificateService.deleteCertificate(id);
      showToast('success', 'Certificate deleted successfully');
      router.push(ROUTES.DASHBOARD.CERTIFICATES);
    } catch (err: unknown) {
      showToast(
        'error',
        err.response?.data?.message || 'Failed to delete certificate',
      );
    }
    setShowDeleteModal(false);
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: certificate?.title || 'My Certificate',
          text: `Check out my ${certificate?.title} certificate from ${certificate?.issuer}`,
          url: shareUrl,
        })
        .catch((err) => {
          console.error('Error sharing:', err);
        });
    } else {
      setShowQRModal(true);
    }
  };

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        showToast('success', 'Link copied to clipboard');
      })
      .catch((err) => {
        showToast('error', 'Failed to copy link');
      });
  };

  // Download certificate
  const handleDownload = () => {
    if (certificate?.fileUrl) {
      const link = document.createElement('a');
      link.href = certificate.fileUrl;
      link.download = `${certificate.title} - ${certificate.issuer}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast('error', 'No certificate file available for download');
    }
  };

  // Print certificate
  const handlePrint = () => {
    window.print();
  };

  // Check if certificate is expired
  const isCertificateExpired = () => {
    if (!certificate?.expiryDate) return false;

    const expiryDate = new Date(certificate.expiryDate);
    const today = new Date();

    return expiryDate < today;
  };

  // Get certificate status label
  const getCertificateStatus = () => {
    if (!certificate?.expiryDate) return 'Active';

    if (isCertificateExpired()) {
      return 'Expired';
    } else {
      const expiryDate = new Date(certificate.expiryDate);
      const today = new Date();
      const daysLeft = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysLeft <= 30) {
        return `Expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
      } else {
        return 'Active';
      }
    }
  };

  // Get certificate status color
  const getCertificateStatusColor = () => {
    const status = getCertificateStatus();

    if (status === 'Expired') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else if (status.includes('Expiring')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Card className="p-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading certificate details...
            </p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (error || !certificate) {
    return (
      <MainLayout>
        <Card className="p-8">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Certificate Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
              {error ||
                "We couldn't find the certificate you're looking for. It may have been deleted or you may not have permission to view it."}
            </p>
            <Button
              onClick={() => router.push(ROUTES.DASHBOARD.CERTIFICATES)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Back to Certificates
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="certificates-container space-y-6">
        {/* Top Actions */}
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => router.push(ROUTES.DASHBOARD.CERTIFICATES)}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Certificate Details
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full',
                getCertificateStatusColor(),
              )}
            >
              {getCertificateStatus()}
            </div>

            <Switch
              checked={is3DMode}
              onChange={setIs3DMode}
              label="3D Mode"
              size="sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Certificate Display */}
          <div className="lg:col-span-8">
            <div
              className="flex justify-center p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md"
              ref={certificateRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {certificate.fileUrl ? (
                <motion.div
                  className={cn(
                    'relative w-full max-w-2xl overflow-hidden border-8 border-gray-200 dark:border-gray-700 rounded-md shadow-lg',
                    is3DMode ? 'transform-gpu' : '',
                  )}
                  style={
                    is3DMode ? { rotateX, rotateY, perspective: 1000 } : {}
                  }
                >
                  {certificate.fileUrl.endsWith('.pdf') ? (
                    <div className="aspect-[4/3] flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                      <div className="text-center p-4">
                        <Award
                          size={64}
                          className="mx-auto mb-4 text-blue-500 dark:text-blue-400"
                        />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {certificate.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          PDF Certificate
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          leftIcon={<Download size={16} />}
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={certificate.fileUrl}
                      alt={certificate.title}
                      className="w-full h-auto"
                    />
                  )}

                  {/* Realistic sheen effect */}
                  {is3DMode && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-5 pointer-events-none"
                      style={{
                        rotateX,
                        rotateY,
                        scale: 1.2,
                      }}
                    />
                  )}
                </motion.div>
              ) : (
                <div className="aspect-[4/3] w-full max-w-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-md">
                  <div className="text-center p-4">
                    <Award
                      size={64}
                      className="mx-auto mb-4 text-blue-500 dark:text-blue-400"
                    />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {certificate.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No certificate file uploaded
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col">
              <div className="p-6 flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {certificate.title}
                </h2>

                <div className="space-y-4">
                  {/* Issuer */}
                  <div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                      <Building size={16} className="mr-2" />
                      <span className="text-sm font-medium">
                        Issuing Organization
                      </span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-white ml-6">
                      {certificate.issuer}
                    </p>
                  </div>

                  {/* Dates */}
                  <div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar size={16} className="mr-2" />
                      <span className="text-sm font-medium">Issue Date</span>
                    </div>
                    <p className="text-base text-gray-900 dark:text-white ml-6">
                      {formatDate(certificate.issueDate)}
                    </p>
                  </div>

                  {certificate.expiryDate && (
                    <div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                        <Calendar size={16} className="mr-2" />
                        <span className="text-sm font-medium">Expiry Date</span>
                      </div>
                      <p className="text-base text-gray-900 dark:text-white ml-6">
                        {formatDate(certificate.expiryDate)}
                      </p>
                    </div>
                  )}

                  {/* Credential ID */}
                  {certificate.credentialId && (
                    <div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                        <FileCheck size={16} className="mr-2" />
                        <span className="text-sm font-medium">
                          Credential ID
                        </span>
                      </div>
                      <div className="flex items-center ml-6">
                        <p className="text-base text-gray-900 dark:text-white">
                          {certificate.credentialId}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              certificate.credentialId || '',
                            );
                            showToast(
                              'success',
                              'Credential ID copied to clipboard',
                            );
                          }}
                          className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Credential URL */}
                  {certificate.credentialUrl && (
                    <div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                        <LinkIcon size={16} className="mr-2" />
                        <span className="text-sm font-medium">
                          Verification Link
                        </span>
                      </div>
                      <div className="ml-6">
                        <a
                          href={certificate.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                        >
                          <span className="truncate">Verify Certificate</span>
                          <ExternalLink
                            size={14}
                            className="ml-1 flex-shrink-0"
                          />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                      <Award size={16} className="mr-2" />
                      <span className="text-sm font-medium">Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-6">
                      {certificate.skills.map((skill) => (
                        <Badge
                          key={skill}
                          text={skill}
                          variant="primary"
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit size={16} />}
                  onClick={() =>
                    router.push(`${ROUTES.DASHBOARD.CERTIFICATES}/edit/${id}`)
                  }
                >
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 size={16} />}
                  onClick={handleShare}
                >
                  Share
                </Button>

                {certificate.fileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer size={16} />}
                  onClick={handlePrint}
                >
                  Print
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Description */}
        {certificate.description && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Description
            </h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: certificate.description }}
            />
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Certificate"
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle
                size={24}
                className="text-red-600 dark:text-red-400"
              />
            </div>
          </div>
          <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-2">
            Are you sure you want to delete this certificate?
          </h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
            This action cannot be undone. The certificate will be permanently
            removed from your profile.
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Share Certificate"
      >
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeCanvas
                value={shareUrl}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: '/images/logo-icon.png',
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Share Link
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Options
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: certificate.title,
                      text: `Check out my ${certificate.title} certificate from ${certificate.issuer}`,
                      url: shareUrl,
                    });
                  }
                }}
                className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                disabled={!navigator.share}
              >
                <Smartphone
                  size={24}
                  className="text-blue-600 dark:text-blue-500 mb-2"
                />
                <span className="text-xs">Mobile</span>
              </button>

              <a
                href={`mailto:?subject=${encodeURIComponent(`My ${certificate.title} Certificate`)}&body=${encodeURIComponent(`I wanted to share my ${certificate.title} certificate from ${certificate.issuer}. You can view it here: ${shareUrl}`)}`}
                className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs">Email</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-6 w-6 text-blue-800 dark:text-blue-700 mb-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span className="text-xs">LinkedIn</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just earned the ${certificate.title} certificate from ${certificate.issuer}!`)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-6 w-6 text-blue-500 dark:text-blue-400 mb-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
                <span className="text-xs">Twitter</span>
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};
