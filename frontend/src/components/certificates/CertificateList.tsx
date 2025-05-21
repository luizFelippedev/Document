// frontend/src/components/certificates/CertificateList.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { certificateService } from '@/services/certificate.service';
import { useNotification } from '@/hooks/useNotification';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/config/routes';
import { Certificate } from '@/types/certificate';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Award,
  ExternalLink,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDate, getRelativeTime } from '@/utils/date';
import { motion } from 'framer-motion';

export const CertificateList = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>(
    'newest',
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'expired'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(
    null,
  );

  const router = useRouter();
  const { showToast } = useNotification();

  const itemsPerPage = 9;

  // Fetch certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const data = await certificateService.getCertificates();
        setCertificates(data);
      } catch (error: unknown) {
        showToast(
          'error',
          error.response?.data?.message || 'Failed to load certificates',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [showToast]);

  // Handle navigation
  const handleCreate = () => {
    router.push(ROUTES.DASHBOARD.CERTIFICATES + '/new');
  };

  const handleView = (id: string) => {
    router.push(`${ROUTES.DASHBOARD.CERTIFICATES}/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`${ROUTES.DASHBOARD.CERTIFICATES}/edit/${id}`);
  };

  // Handle certificate deletion
  const handleDelete = (id: string) => {
    setCertificateToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!certificateToDelete) return;

    try {
      await certificateService.deleteCertificate(certificateToDelete);
      showToast('success', 'Certificate deleted successfully');
      setCertificates(
        certificates.filter((cert) => cert.id !== certificateToDelete),
      );
      setShowDeleteModal(false);
      setCertificateToDelete(null);
    } catch (error: unknown) {
      showToast(
        'error',
        error.response?.data?.message || 'Failed to delete certificate',
      );
    }
  };

  // Check if a certificate is expired
  const isCertificateExpired = (certificate: Certificate) => {
    if (!certificate.expiryDate) return false;

    const expiryDate = new Date(certificate.expiryDate);
    const today = new Date();

    return expiryDate < today;
  };

  // Filter and sort certificates
  const filteredCertificates = useMemo(() => {
    let filtered = [...certificates];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cert) =>
          cert.title.toLowerCase().includes(query) ||
          cert.issuer.toLowerCase().includes(query) ||
          cert.credentialId?.toLowerCase().includes(query) ||
          cert.skills.some((skill) => skill.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter((cert) => cert.category === filterCategory);
    }

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter((cert) => !isCertificateExpired(cert));
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter((cert) => isCertificateExpired(cert));
    }

    // Sort certificates
    switch (sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime(),
        );
        break;
      case 'a-z':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  }, [certificates, searchQuery, filterCategory, filterStatus, sortBy]);

  // Paginate certificates
  const paginatedCertificates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCertificates.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCertificates, currentPage]);

  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Generate CSS color from certificate name for the background
  const getCertificateColor = (title: string, issuer: string) => {
    const str = title + issuer;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600',
      'from-purple-500 to-indigo-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-cyan-500 to-blue-600',
      'from-fuchsia-500 to-purple-600',
      'from-teal-500 to-green-600',
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <MainLayout>
      <div className="certificates-container space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Certificates
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage and showcase your professional certifications
            </p>
          </div>

          <Button
            onClick={handleCreate}
            className="flex items-center"
            leftIcon={<Plus size={16} />}
          >
            Add New Certificate
          </Button>
        </div>

        <Card>
          <div className="p-4">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
              <div className="w-full md:w-1/2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search certificates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category filter */}
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'it-certification', label: 'IT Certification' },
                    {
                      value: 'professional-license',
                      label: 'Professional License',
                    },
                    { value: 'course-completion', label: 'Course Completion' },
                    { value: 'academic-degree', label: 'Academic Degree' },
                    { value: 'award', label: 'Award' },
                    { value: 'other', label: 'Other' },
                  ]}
                  variant="filled"
                  size="sm"
                  className="w-40"
                />

                {/* Status filter */}
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                  variant="filled"
                  size="sm"
                  className="w-32"
                />

                {/* Sort order */}
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'a-z', label: 'A-Z' },
                    { value: 'z-a', label: 'Z-A' },
                  ]}
                  variant="filled"
                  size="sm"
                  className="w-36"
                />

                {/* Clear filters button */}
                {(searchQuery ||
                  filterCategory !== 'all' ||
                  filterStatus !== 'all' ||
                  sortBy !== 'newest') && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Certificate Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent animate-spin"></div>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Award
                      size={24}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No certificates found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ||
                  filterCategory !== 'all' ||
                  filterStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first certificate'}
                </p>
                {searchQuery ||
                filterCategory !== 'all' ||
                filterStatus !== 'all' ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                ) : (
                  <Button onClick={handleCreate}>
                    <Plus size={16} className="mr-2" />
                    Add Certificate
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCertificates.map((certificate, index) => (
                  <motion.div
                    key={certificate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleView(certificate.id)}
                    >
                      {/* Certificate Header/Banner */}
                      <div
                        className={cn(
                          'relative h-24 bg-gradient-to-r',
                          getCertificateColor(
                            certificate.title,
                            certificate.issuer,
                          ),
                        )}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                            <Award size={24} className="text-white" />
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          {isCertificateExpired(certificate) ? (
                            <Badge text="Expired" variant="danger" size="sm" />
                          ) : (
                            <Badge text="Active" variant="success" size="sm" />
                          )}
                        </div>
                      </div>

                      {/* Certificate Body */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {certificate.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {certificate.issuer}
                        </p>

                        {/* Issue Date */}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <Calendar size={14} className="mr-1" />
                          Issued: {formatDate(certificate.issueDate)}
                          {certificate.expiryDate && (
                            <>
                              {' '}
                              • Expires: {formatDate(certificate.expiryDate)}
                            </>
                          )}
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {certificate.skills.slice(0, 3).map((skill) => (
                              <Badge
                                key={skill}
                                text={skill}
                                variant="outline"
                                size="sm"
                              />
                            ))}
                            {certificate.skills.length > 3 && (
                              <Badge
                                text={`+${certificate.skills.length - 3}`}
                                variant="outline"
                                size="sm"
                              />
                            )}
                          </div>
                        </div>

                        {/* Verification */}
                        {certificate.credentialId && (
                          <div className="flex items-center mb-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium mr-1">ID:</span>{' '}
                            {certificate.credentialId}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(certificate.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Certificate"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(certificate.id);
                              }}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Edit Certificate"
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(certificate.id);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete Certificate"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {certificate.credentialUrl && (
                            <a
                              href={certificate.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Verify Certificate"
                            >
                              <ExternalLink size={18} />
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </Card>
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
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};
