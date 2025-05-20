// frontend/src/services/certificate.service.ts
import { api } from '@/lib/axios';
import { Certificate } from '@/types/certificate';

export const certificateService = {
  /**
   * Get all certificates
   */
  async getCertificates() {
    const response = await api.get('/certificates');
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
    return response.data.certificate;
  },
  
  /**
   * Delete a certificate
   */
  async deleteCertificate(id: string) {
    const response = await api.delete(`/certificates/${id}`);
    return response.data;
  },
  
  /**
   * Verify certificate authenticity
   */
  async verifyCertificate(id: string, credentialId: string) {
    const response = await api.get(`/certificates/verify/${id}`, {
      params: { credentialId }
    });
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
   * Filter certificates by skills
   */
  async filterCertificatesBySkills(skills: string[]) {
    const response = await api.get('/certificates/filter', {
      params: { skills: skills.join(',') }
    });
    return response.data.certificates;
  },
  
  /**
   * Search certificates
   */
  async searchCertificates(query: string) {
    const response = await api.get('/certificates/search', {
      params: { query }
    });
    return response.data.certificates;
  }
};