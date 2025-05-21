// frontend/src/app/(dashboard)/certificates/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { ROUTES } from '@/config/routes';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Calendar,
  Award,
  FileCheck,
  Shield,
  Share2,
  Fingerprint,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// Mock data - would be replaced with API call
const getCertificateById = (id: string) => {
  const mockCertificates = [
    {
      id: '1',
      title: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2025-02-15',
      expiryDate: '2028-02-15',
      credentialId: 'AWS-CSA-12345',
      credentialUrl: 'https://aws.amazon.com/verification',
      skills: ['Cloud Architecture', 'AWS Services', 'Infrastructure Design'],
      description: 'Certification for designing distributed systems on AWS',
      verified: true,
      thumbnailUrl: '/certificates/aws-cert.jpg',
      verificationDetails: {
        blockchainVerified: true,
        lastVerified: '2025-05-10T14:23:00Z',
        verificationHistory: [
          {
            date: '2025-05-10T14:23:00Z',
            status: 'success',
            method: 'blockchain',
          },
          { date: '2025-04-15T10:05:00Z', status: 'success', method: 'issuer' },
        ],
        blockchainTxId: '0x3a1e02c4d6a2bd5e3e304841b131572a8c4f7b71',
        blockchainNetwork: 'Ethereum',
      },
    },
    {
      id: '2',
      title: 'Professional Scrum Master I',
      issuer: 'Scrum.org',
      issueDate: '2024-11-10',
      expiryDate: null,
      credentialId: 'PSM-I-87654',
      credentialUrl: 'https://scrum.org/verification',
      skills: ['Agile Methodologies', 'Scrum Framework', 'Team Management'],
      description: 'Professional certification for Scrum Masters',
      verified: true,
      thumbnailUrl: '/certificates/scrum-cert.jpg',
      verificationDetails: {
        blockchainVerified: true,
        lastVerified: '2025-05-08T09:12:00Z',
        verificationHistory: [
          {
            date: '2025-05-08T09:12:00Z',
            status: 'success',
            method: 'blockchain',
          },
          { date: '2025-03-22T16:30:00Z', status: 'success', method: 'issuer' },
        ],
        blockchainTxId: '0x7b9c42f1d6a8e4c5a3b2f1d6a8e4c5a3b2f1d6a8',
        blockchainNetwork: 'Polygon',
      },
    },
    {
      id: '3',
      title: 'Google Professional Data Engineer',
      issuer: 'Google Cloud',
      issueDate: '2025-01-20',
      expiryDate: '2027-01-20',
      credentialId: 'GCP-PDE-56789',
      credentialUrl: 'https://cloud.google.com/certification/verification',
      skills: ['Data Processing', 'Machine Learning', 'Data Analytics', 'GCP'],
      description:
        'Certification for designing and building data processing systems on Google Cloud',
      verified: true,
      thumbnailUrl: '/certificates/gcp-cert.jpg',
      verificationDetails: {
        blockchainVerified: true,
        lastVerified: '2025-05-02T11:18:00Z',
        verificationHistory: [
          {
            date: '2025-05-02T11:18:00Z',
            status: 'success',
            method: 'blockchain',
          },
          { date: '2025-02-14T08:45:00Z', status: 'success', method: 'issuer' },
        ],
        blockchainTxId: '0x9d2e85f6c4b3a1d7e2f9c8b5a4d3e2f1c0b9a8d7',
        blockchainNetwork: 'Ethereum',
      },
    },
    {
      id: '4',
      title: 'Certified Kubernetes Administrator',
      issuer: 'Cloud Native Computing Foundation',
      issueDate: '2024-09-05',
      expiryDate: '2027-09-05',
      credentialId: 'CKA-98765',
      credentialUrl: 'https://www.cncf.io/certification/verification',
      skills: ['Kubernetes', 'Container Orchestration', 'Cloud Native'],
      description: 'Certification for Kubernetes administration and operations',
      verified: false,
      thumbnailUrl: '/certificates/k8s-cert.jpg',
      verificationDetails: {
        blockchainVerified: false,
        lastVerified: null,
        verificationHistory: [],
        blockchainTxId: null,
        blockchainNetwork: null,
      },
    },
  ];

  return mockCertificates.find((cert) => cert.id === id) || null;
};

export default function CertificateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  // Fetch certificate details
  useEffect(() => {
    const loadCertificate = async () => {
      try {
        // In a real app, this would fetch from your API
        const certificateData = getCertificateById(params.id);

        if (!certificateData) {
          setError('Certificate not found');
        } else {
          setCertificate(certificateData);
        }
      } catch (err) {
        setError('Failed to load certificate details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Simulate API call
    setTimeout(loadCertificate, 1000);
  }, [params.id]);

  // Handle certificate deletion
  const handleDeleteCertificate = () => {
    // In a real app, this would make an API call to delete the certificate
    setDeleteModalOpen(false);

    // Simulate successful deletion
    setTimeout(() => {
      router.push(ROUTES.DASHBOARD.CERTIFICATES.ROOT);
    }, 500);
  };

  // Handle certificate verification
  const handleVerifyCertificate = async () => {
    setVerifying(true);

    try {
      // In a real app, this would make an API call to verify the certificate
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful verification
      setCertificate((prev) => ({
        ...prev,
        verified: true,
        verificationDetails: {
          ...prev.verificationDetails,
          blockchainVerified: true,
          lastVerified: new Date().toISOString(),
          verificationHistory: [
            {
              date: new Date().toISOString(),
              status: 'success',
              method: 'blockchain',
            },
            ...(prev.verificationDetails?.verificationHistory || []),
          ],
          blockchainTxId: '0x' + Math.random().toString(16).substring(2, 42),
          blockchainNetwork: 'Ethereum',
        },
      }));
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
      setVerificationModalOpen(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'verification', label: 'Verification' },
    { id: 'share', label: 'Share' },
  ];

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format datetime function
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="large" label="Loading certificate details..." />
        </div>
      </MainLayout>
    );
  }

  if (error || !certificate) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href={ROUTES.DASHBOARD.CERTIFICATES.ROOT}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Certificates
            </Link>
          </div>

          <Alert
            type="error"
            title="Error"
            message={error || 'Certificate not found'}
            action={{
              label: 'Go back to certificates',
              onClick: () => router.push(ROUTES.DASHBOARD.CERTIFICATES.ROOT),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={ROUTES.DASHBOARD.CERTIFICATES.ROOT}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Certificates
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {certificate.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                text={certificate.verified ? 'Verified' : 'Unverified'}
                variant={certificate.verified ? 'success' : 'warning'}
                icon={
                  certificate.verified ? <FileCheck size={14} /> : undefined
                }
              />

              <span className="text-gray-600 dark:text-gray-400">
                Issued by {certificate.issuer}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<Download size={16} />}
              onClick={() => console.log('Download certificate')}
            >
              Download
            </Button>

            <Button
              variant="outline"
              leftIcon={<Edit size={16} />}
              onClick={() =>
                router.push(
                  `${ROUTES.DASHBOARD.CERTIFICATES.EDIT}/${certificate.id}`,
                )
              }
            >
              Edit
            </Button>

            <Button
              variant="danger"
              leftIcon={<Trash2 size={16} />}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Certificate tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Certificate image */}
                <Card>
                  <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
                    {certificate.thumbnailUrl ? (
                      <img
                        src={certificate.thumbnailUrl}
                        alt={certificate.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <Award
                          size={48}
                          className="text-gray-400 dark:text-gray-500"
                        />
                      </div>
                    )}

                    {/* Verification badge overlay */}
                    {certificate.verified && (
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-300 rounded-full px-3 py-1 flex items-center">
                          <CheckCircle size={16} className="mr-1" />
                          Blockchain Verified
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Certificate description */}
                <Card title="Description">
                  <p className="text-gray-700 dark:text-gray-300">
                    {certificate.description}
                  </p>
                </Card>

                {/* Skills */}
                <Card title="Associated Skills">
                  <div className="flex flex-wrap gap-2">
                    {certificate.skills.map((skill: string, index: number) => (
                      <div
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Certificate info */}
                <Card title="Certificate Information">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Issuer
                      </h4>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {certificate.issuer}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Issue Date
                      </h4>
                      <div className="flex items-center mt-1">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {formatDate(certificate.issueDate)}
                        </span>
                      </div>
                    </div>

                    {certificate.expiryDate && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Expiry Date
                        </h4>
                        <div className="flex items-center mt-1">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {formatDate(certificate.expiryDate)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Credential ID
                      </h4>
                      <p className="mt-1 text-gray-900 dark:text-white font-mono text-sm">
                        {certificate.credentialId}
                      </p>
                    </div>

                    {certificate.credentialUrl && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Credential URL
                        </h4>
                        <a
                          href={certificate.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          Verify at issuer
                        </a>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Verification status */}
                <Card title="Verification Status">
                  <div className="space-y-4">
                    <div
                      className={`p-3 rounded-lg ${
                        certificate.verified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <div className="flex items-center">
                        {certificate.verified ? (
                          <>
                            <CheckCircle size={20} className="mr-2" />
                            <span className="font-medium">
                              Verified Certificate
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={20} className="mr-2" />
                            <span className="font-medium">
                              Unverified Certificate
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-sm mt-1">
                        {certificate.verified
                          ? 'This certificate has been verified and recorded on the blockchain.'
                          : 'This certificate has not been verified yet.'}
                      </p>
                    </div>

                    {certificate.verified ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last verified on{' '}
                        {formatDateTime(
                          certificate.verificationDetails?.lastVerified,
                        )}
                      </p>
                    ) : (
                      <Button
                        fullWidth
                        leftIcon={<Shield size={16} />}
                        onClick={() => setVerificationModalOpen(true)}
                      >
                        Verify Certificate
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Verification Details">
                {certificate.verified ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <div className="flex items-center text-green-800 dark:text-green-300 mb-2">
                        <CheckCircle size={20} className="mr-2" />
                        <h3 className="text-lg font-medium">
                          Certificate Successfully Verified
                        </h3>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        This certificate has been cryptographically verified and
                        recorded on the blockchain. This ensures that the
                        certificate is authentic and has not been tampered with.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        Blockchain Record
                      </h3>

                      <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Transaction ID
                          </div>
                          <div className="mt-1 font-mono text-sm break-all text-gray-900 dark:text-white">
                            {certificate.verificationDetails?.blockchainTxId}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Blockchain Network
                          </div>
                          <div className="mt-1 text-gray-900 dark:text-white">
                            {certificate.verificationDetails?.blockchainNetwork}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Verification Date
                          </div>
                          <div className="mt-1 text-gray-900 dark:text-white">
                            {formatDateTime(
                              certificate.verificationDetails?.lastVerified,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Certificate Hash
                          </div>
                          <div className="mt-1 font-mono text-sm break-all text-gray-900 dark:text-white">
                            SHA-256:
                            4a3b8f2c9d0e1f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        Verification History
                      </h3>

                      <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 pl-6 space-y-6">
                        {certificate.verificationDetails?.verificationHistory.map(
                          (record: unknown, index: number) => (
                            <div key={index} className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-9 mt-1">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                                    record.status === 'success'
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                  }`}
                                ></div>
                              </div>

                              <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                                    {record.method === 'blockchain'
                                      ? 'Blockchain Verification'
                                      : 'Issuer Verification'}
                                  </h4>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDateTime(record.date)}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {record.status === 'success'
                                    ? `Successfully verified certificate via ${record.method}.`
                                    : `Verification failed via ${record.method}.`}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <div className="flex items-center text-amber-800 dark:text-amber-300 mb-2">
                        <AlertTriangle size={20} className="mr-2" />
                        <h3 className="text-lg font-medium">
                          Certificate Not Yet Verified
                        </h3>
                      </div>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        This certificate has not been verified on the
                        blockchain. Verification ensures that your certificate
                        is authentic and tamper-proof.
                      </p>
                    </div>

                    <div className="text-center py-8">
                      <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Shield size={36} className="text-gray-400" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        Start Verification Process
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Verify your certificate by adding it to the blockchain.
                        This creates a permanent, tamper-proof record of your
                        achievement.
                      </p>
                      <Button
                        leftIcon={<Shield size={16} />}
                        onClick={() => setVerificationModalOpen(true)}
                      >
                        Verify Certificate
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Card title="Share Your Certificate">
                <div className="space-y-6">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center text-blue-800 dark:text-blue-300 mb-2">
                      <Share2 size={20} className="mr-2" />
                      <h3 className="text-lg font-medium">
                        Share Your Achievement
                      </h3>
                    </div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Share your verified certificate with others. You can share
                      a direct link, download the certificate image, or share it
                      on social media.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Certificate Link
                    </h3>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://your-domain.com/certificates/verify/${certificate.id}`}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      />
                      <Button>Copy Link</Button>
                    </div>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Anyone with this link can view and verify your
                      certificate.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Share on Social Media
                    </h3>

                    <div className="flex flex-wrap gap-3">
                      <button className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                        </svg>
                      </button>

                      <button className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-800 text-white hover:bg-blue-900">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-1.076.252-1.076.889v1.111h3l-.238 3h-2.762v8h-3v-8h-2v-3h2v-1.923c0-2.022 1.064-3.077 3.461-3.077h2.539v3z" />
                        </svg>
                      </button>

                      <button className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Download Certificate
                    </h3>

                    <div className="flex flex-wrap gap-3">
                      <Button leftIcon={<Download size={16} />}>
                        Download as PNG
                      </Button>

                      <Button
                        variant="outline"
                        leftIcon={<Download size={16} />}
                      >
                        Download as PDF
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Embed Code
                    </h3>

                    <textarea
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs"
                      rows={5}
                      value={`<iframe src="https://your-domain.com/certificates/embed/${certificate.id}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`}
                    ></textarea>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Use this code to embed your certificate on your website or
                      portfolio.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Certificate"
        message="Are you sure you want to delete this certificate? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCertificate}
        confirmVariant="danger"
      />

      {/* Verification modal */}
      <Modal
        isOpen={verificationModalOpen}
        onClose={() => !verifying && setVerificationModalOpen(false)}
        title="Verify Certificate"
        size="md"
      >
        <div className="p-6 space-y-6">
          {verifying ? (
            <div className="text-center py-8">
              <Spinner size="large" className="mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Verifying Certificate
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your certificate on the
                blockchain...
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center text-blue-800 dark:text-blue-300 mb-4">
                <Fingerprint size={24} className="mr-3" />
                <h3 className="text-xl font-medium">Blockchain Verification</h3>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You are about to verify this certificate by registering it on
                the blockchain. This process:
              </p>

              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-2 mb-6">
                <li>
                  Creates a permanent, tamper-proof record of your certificate
                </li>
                <li>
                  Allows anyone to verify the authenticity of your certificate
                </li>
                <li>Enhances the value and credibility of your achievement</li>
              </ul>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setVerificationModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleVerifyCertificate}
                  leftIcon={<Shield size={16} />}
                >
                  Verify Certificate
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
}
