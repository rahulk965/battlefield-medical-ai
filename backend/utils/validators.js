// Validation utilities for military medical data

export class MedicalValidators {
  // Validate soldier ID format
  static validateSoldierId(soldierId) {
    if (!soldierId || typeof soldierId !== 'string') {
      return { valid: false, error: 'Soldier ID is required and must be a string' };
    }

    // Basic soldier ID format validation
    const soldierIdRegex = /^[A-Z0-9]{3,15}-[A-Z0-9]{3,10}$/;
    if (!soldierIdRegex.test(soldierId)) {
      return { valid: false, error: 'Invalid soldier ID format' };
    }

    return { valid: true };
  }

  // Validate medical symptoms
  static validateSymptoms(symptoms) {
    if (!symptoms) {
      return { valid: false, error: 'Symptoms are required' };
    }

    if (typeof symptoms !== 'string' && !Array.isArray(symptoms)) {
      return { valid: false, error: 'Symptoms must be a string or array' };
    }

    // Check length limits
    const symptomsString = Array.isArray(symptoms) ? symptoms.join(' ') : symptoms;
    if (symptomsString.length > 1000) {
      return { valid: false, error: 'Symptoms description too long (max 1000 characters)' };
    }

    // Check for dangerous characters (basic XSS prevention)
    const dangerousChars = /[<>{}]/;
    if (dangerousChars.test(symptomsString)) {
      return { valid: false, error: 'Symptoms contain invalid characters' };
    }

    return { valid: true, normalized: Array.isArray(symptoms) ? symptoms : [symptoms] };
  }

  // Validate vital signs
  static validateVitalSigns(vitalSigns) {
    if (!vitalSigns || typeof vitalSigns !== 'object') {
      return { valid: false, error: 'Vital signs must be an object' };
    }

    const validated = {};
    const errors = [];

    // Heart rate validation
    if (vitalSigns.heartRate !== undefined) {
      const hr = parseInt(vitalSigns.heartRate);
      if (isNaN(hr) || hr < 30 || hr > 250) {
        errors.push('Heart rate must be between 30 and 250 BPM');
      } else {
        validated.heartRate = hr;
      }
    }

    // Respiratory rate validation
    if (vitalSigns.respiratoryRate !== undefined) {
      const rr = parseInt(vitalSigns.respiratoryRate);
      if (isNaN(rr) || rr < 5 || rr > 60) {
        errors.push('Respiratory rate must be between 5 and 60 breaths per minute');
      } else {
        validated.respiratoryRate = rr;
      }
    }

    // Blood pressure validation
    if (vitalSigns.bloodPressure !== undefined) {
      const bpRegex = /^(\d{2,3})\/(\d{2,3})$/;
      const match = vitalSigns.bloodPressure.match(bpRegex);
      
      if (!match) {
        errors.push('Blood pressure must be in format "120/80"');
      } else {
        const systolic = parseInt(match[1]);
        const diastolic = parseInt(match[2]);
        
        if (systolic < 60 || systolic > 250 || diastolic < 40 || diastolic > 150) {
          errors.push('Blood pressure values out of reasonable range');
        } else {
          validated.bloodPressure = { systolic, diastolic };
        }
      }
    }

    // Oxygen saturation validation
    if (vitalSigns.oxygenSaturation !== undefined) {
      const spo2 = parseInt(vitalSigns.oxygenSaturation);
      if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
        errors.push('Oxygen saturation must be between 50% and 100%');
      } else {
        validated.oxygenSaturation = spo2;
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, validated };
  }

  // Validate location data
  static validateLocation(location) {
    if (!location) {
      return { valid: true, location: null }; // Location is optional
    }

    const errors = [];

    if (location.coordinates && Array.isArray(location.coordinates)) {
      if (location.coordinates.length !== 2) {
        errors.push('Coordinates must be an array of [longitude, latitude]');
      } else {
        const [lng, lat] = location.coordinates;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          errors.push('Longitude and latitude must be numbers');
        } else if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          errors.push('Invalid coordinate values');
        }
      }
    }

    if (location.accuracy !== undefined) {
      if (typeof location.accuracy !== 'number' || location.accuracy < 0) {
        errors.push('Accuracy must be a positive number');
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, location };
  }

  // Validate image data
  static validateImageData(imageData) {
    if (!imageData) {
      return { valid: false, error: 'Image data is required' };
    }

    const errors = [];

    // Check data URL format
    if (imageData.data && typeof imageData.data === 'string') {
      const dataUrlRegex = /^data:image\/(jpeg|png|gif|webp);base64,/;
      if (!dataUrlRegex.test(imageData.data)) {
        errors.push('Invalid image data URL format');
      }
    }

    // Check file size (rough estimate from base64)
    if (imageData.data && imageData.data.length > 10 * 1024 * 1024) {
      errors.push('Image size exceeds 10MB limit');
    }

    // Check MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (imageData.type && !allowedTypes.includes(imageData.type)) {
      errors.push(`Unsupported image type: ${imageData.type}`);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  // Validate medical record structure
  static validateMedicalRecord(record) {
    const errors = [];

    // Check required fields
    if (!record.soldierId) {
      errors.push('Soldier ID is required');
    } else {
      const soldierIdValidation = this.validateSoldierId(record.soldierId);
      if (!soldierIdValidation.valid) {
        errors.push(soldierIdValidation.error);
      }
    }

    if (!record.encryptedData) {
      errors.push('Encrypted data is required');
    }

    // Validate metadata if present
    if (record.metadata) {
      if (record.metadata.triageLevel) {
        const validTriageLevels = ['IMMEDIATE', 'DELAYED', 'MINOR', 'EXPECTANT'];
        if (!validTriageLevels.includes(record.metadata.triageLevel)) {
          errors.push(`Invalid triage level: ${record.metadata.triageLevel}`);
        }
      }

      if (record.metadata.location) {
        const locationValidation = this.validateLocation(record.metadata.location);
        if (!locationValidation.valid) {
          errors.push(...locationValidation.errors);
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  // Sanitize user input
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      // Basic HTML escaping
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  // Validate authentication token format
  static validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token must be a string' };
    }

    // Basic JWT format validation (3 parts separated by dots)
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtRegex.test(token)) {
      return { valid: false, error: 'Invalid token format' };
    }

    return { valid: true };
  }

  // Validate device fingerprint
  static validateDeviceFingerprint(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'string') {
      return { valid: false, error: 'Device fingerprint must be a string' };
    }

    // SHA256 hash format (64 hex characters)
    const sha256Regex = /^[a-f0-9]{64}$/;
    if (!sha256Regex.test(fingerprint)) {
      return { valid: false, error: 'Invalid device fingerprint format' };
    }

    return { valid: true };
  }
}

// Export validation middleware
export const validateRequest = (validationRules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(validationRules)) {
      const value = req.body[field];

      // Required field validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Type validation
      if (rules.type && value !== undefined) {
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        } else if (rules.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors.push(`${field} must be an object`);
        } else if (typeof value !== rules.type) {
          errors.push(`${field} must be a ${rules.type}`);
        }
      }

      // Custom validation function
      if (rules.validate && value !== undefined) {
        const customValidation = rules.validate(value);
        if (!customValidation.valid) {
          errors.push(`${field}: ${customValidation.error}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date()
      });
    }

    next();
  };
};

export default MedicalValidators;