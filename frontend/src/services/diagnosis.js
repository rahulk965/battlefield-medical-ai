import { apiClient } from './api';
import { logger } from '../utils/logger';

export const diagnosisService = {
  async analyzeSymptoms(symptoms, imageData, location, vitalSigns = {}) {
    try {
      // Validate input
      if (!symptoms && !imageData) {
        throw new Error('Either symptoms or image data must be provided');
      }

      // Format location data properly
      const formattedLocation = location ? {
        coordinates: location.coordinates || [0, 0],
        accuracy: location.accuracy || 0,
        timestamp: location.timestamp || new Date()
      } : null;

      // Prepare request payload
      const payload = {
        symptoms: symptoms || '',
        location: formattedLocation,
        vitalSigns: {
          ...vitalSigns,
          timestamp: new Date()
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          online: navigator.onLine
        }
      };

      // Add image data if present
      if (imageData) {
        payload.imageData = imageData;
      }

      const response = await apiClient.post('/diagnosis/analyze', payload);
      return response.data;
    } catch (error) {
      logger.error('Diagnosis service error:', {
        error,
        request: {
          symptoms: symptoms ? 'provided' : 'not provided',
          hasImage: !!imageData,
          hasLocation: !!location
        }
      });
      throw error;
    }
  },

  async uploadInjuryImage(imageFile, metadata) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const response = await apiClient.post('/injury/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload injury image:', error);
      throw error;
    }
  }
};

export const recordsService = {
  async syncRecords(records) {
    try {
      const response = await apiClient.post('/records/sync', { records });
      return response.data;
    } catch (error) {
      console.error('Failed to sync records:', error);
      throw error;
    }
  }
};