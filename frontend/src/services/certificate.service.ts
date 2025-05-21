// src/services/certificate.service.ts
import { api } from '@/lib/axios';
import { Certificate, CertificateFilter } from '@/types/certificate';
import { socketEvents } from '@/lib/socket';

export const certificateService = {
  /**
   * Get all certificates
   */
  async getCertificates(page = 1, itemsPerPage = 10, filter?: CertificateFilter, userId?: string) {
    // Create params
    const params: Record<string, any> = { page, itemsPerPage };
    
    // Add filter parameters
    if (filter) {
      if (filter.search) params.search = filter.search;
      if (filter.skills) params.skills = filter.skills.join(',');
      if (filter.issuer) params.issuer = filter.issuer;
      if (filter.category) params.category = filter.category;
      if (filter.expired !== undefined) params.expired = filter.expired;
      if (filter.sortBy) params.sortBy = filter.sortBy;
    }
    
    // Add userId if provided
    if (userId) params.userId = userId;
    
    const response = await api.get('/certificates', { params });
    return response.data.certificates;
  },
  
  /**
   * Get a specific certificate by ID
   */
  async getCertificate(id: string) {
    const response = await api.get(`/certificates/${id}`);
    return response.data.certificate;
  },
  
  /**
   * Create a new certificate
   */
  async createCertificate(certificateData: FormData) {
    const response = await api.post('/certificates', certificateData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Emit socket event for real-time updates
    // socketService.emit(socketEvents.certificates.created, response.data.certificate);
    
    return response.data.certificate;
  },
  
  /**
   * Update an existing certificate
   */
  async updateCertificate(id: string, certificateData: FormData) {
    const response = await api.put(`/certificates/${id}`, certificateData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Emit socket event for real-time updates
    // socketService.emit(socketEvents.certificates.updated, response.data.certificate);
    
    return response.data.certificate;
  },
  
  /**
   * Delete a certificate
   */
  async deleteCertificate(id: string) {
    const response = await api.delete(`/certificates/${id}`);
    
    // Emit socket event for real-time updates
    // socketService.emit(socketEvents.certificates.deleted, { id });
    
    return response.data;
  },
  
  /**
   * Download certificate file
   */
  async downloadCertificateFile(id: string, filename?: string) {
    const response = await api.get(`/certificates/${id}/file/download`, {
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from content disposition or use provided filename
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename;
    
    if (!downloadFilename && contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) {
        downloadFilename = matches[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', downloadFilename || `certificate-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up and revoke URL
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  },
  
  /**
   * Verify certificate authenticity
   */
  async verifyCertificate(id: string, credentialId: string) {
    const response = await api.get(`/certificates/verify/${id}`, {
      params: { credentialId }
    });
    
    // Emit socket event for verification
    // socketService.emit(socketEvents.certificates.verified, response.data);
    
    return response.data;
  },
  
  /**
   * Get public certificate by ID
   */
  async getPublicCertificate(id: string) {
    const response = await api.get(`/certificates/public/${id}`);
    return response.data.certificate;
  },
  
  /**
   * Upload certificate image
   */
  async uploadCertificateImage(certificateId: string, imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post(`/certificates/${certificateId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  /**
   * Delete certificate image
   */
  async deleteCertificateImage(certificateId: string, imageId: string) {
    const response = await api.delete(`/certificates/${certificateId}/images/${imageId}`);
    return response.data;
  },
  
  /**
   * Search certificates
   */
  async searchCertificates(query: string) {
    const response = await api.get('/certificates/search', {
      params: { query }
    });
    return response.data.certificates;
  },
  
  /**
   * Filter certificates by skills
   */
  async filterCertificatesBySkills(skills: string[]) {
    const response = await api.get('/certificates/filter', {
      params: { skills: skills.join(',') }
    });
    return response.data.certificates;
  }
};