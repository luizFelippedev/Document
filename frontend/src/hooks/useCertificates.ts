// frontend/src/hooks/useCertificates.ts
'use client';

import { useState, useCallback } from 'react';
import { Certificate, CertificateFilter } from '@/types/certificate';
import { certificateService } from '@/services/certificate.service';
import { useNotification } from './useNotification';

export const useCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotification();
  
  // Get all certificates
  const getCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await certificateService.getCertificates();
      setCertificates(data);
      
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch certificates');
      showToast('error', 'Failed to fetch certificates');
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  // Get certificate by ID
  const getCertificate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await certificateService.getCertificate(id);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch certificate');
      showToast('error', 'Failed to fetch certificate details');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  // Create certificate
  const createCertificate = useCallback(async (certificateData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await certificateService.createCertificate(certificateData);
      setCertificates(prev => [data, ...prev]);
      
      showToast('success', 'Certificate created successfully');
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create certificate');
      showToast('error', 'Failed to create certificate');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  // Update certificate
  const updateCertificate = useCallback(async (id: string, certificateData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await certificateService.updateCertificate(id, certificateData);
      
      setCertificates(prev => 
        prev.map(cert => cert.id === id ? data : cert)
      );
      
      showToast('success', 'Certificate updated successfully');
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update certificate');
      showToast('error', 'Failed to update certificate');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  // Delete certificate
  const deleteCertificate = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await certificateService.deleteCertificate(id);
      setCertificates(prev => prev.filter(cert => cert.id !== id));
      
      showToast('success', 'Certificate deleted successfully');
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete certificate');
      showToast('error', 'Failed to delete certificate');
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  // Filter certificates
  const filterCertificates = useCallback(async (filters: CertificateFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      let filteredCerts = [...certificates];
      
      // Apply local filtering
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredCerts = filteredCerts.filter(cert => 
          cert.title.toLowerCase().includes(searchTerm) ||
          cert.issuer.toLowerCase().includes(searchTerm) ||
          cert.credentialId?.toLowerCase().includes(searchTerm) ||
          cert.skills.some(skill => skill.toLowerCase().includes(searchTerm))
        );
      }
      
      if (filters.skills && filters.skills.length > 0) {
        filteredCerts = filteredCerts.filter(cert => 
          filters.skills!.some(skill => cert.skills.includes(skill))
        );
      }
      
      if (filters.issuer) {
        filteredCerts = filteredCerts.filter(cert => 
          cert.issuer.toLowerCase().includes(filters.issuer!.toLowerCase())
        );
      }
      
      if (filters.category) {
        filteredCerts = filteredCerts.filter(cert => 
          cert.category === filters.category
        );
      }
      
      if (filters.expired !== undefined) {
        const now = new Date();
        filteredCerts = filteredCerts.filter(cert => {
          if (!cert.expiryDate) return !filters.expired; // No expiry date means not expired
          
          const isExpired = new Date(cert.expiryDate) < now;
          return filters.expired ? isExpired : !isExpired;
        });
      }
      
      // Sort results
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            filteredCerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            filteredCerts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'a-z':
            filteredCerts.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'z-a':
            filteredCerts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        }
      }
      
      return filteredCerts;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to filter certificates');
      showToast('error', 'Failed to filter certificates');
      return [];
    } finally {
      setLoading(false);
    }
  }, [certificates, showToast]);
  
  return {
    certificates,
    loading,
    error,
    getCertificates,
    getCertificate,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    filterCertificates
  };
};