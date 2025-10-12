// Utility functions and helpers for Battlefield Medical Assistant

// Date and Time utilities
export const DateUtils = {
  // Format date for display
  formatDate: (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    };
    
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime: (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return DateUtils.formatDate(date);
  },

  // Calculate age from birth date
  calculateAge: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // Validate date string
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
};

// String utilities
export const StringUtils = {
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert camelCase to Title Case
  camelToTitle: (str) => {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, char => char.toUpperCase())
      .trim();
  },

  // Truncate string with ellipsis
  truncate: (str, length = 50) => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Generate initials from name
  getInitials: (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Sanitize input for security
  sanitize: (input) => {
    if (typeof input !== 'string') return input;
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    const reg = /[&<>"'/]/ig;
    return input.replace(reg, match => map[match]);
  }
};

// Number utilities
export const NumberUtils = {
  // Format number with commas
  formatNumber: (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('en-US');
  },

  // Calculate percentage
  percentage: (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Check if value is within range
  inRange: (value, min, max) => {
    return value >= min && value <= max;
  },

  // Generate random number in range
  random: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Round to specified decimal places
  round: (value, decimals = 2) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }
};

// Array utilities
export const ArrayUtils = {
  // Remove duplicates from array
  unique: (array) => {
    return [...new Set(array)];
  },

  // Group array by key
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // Sort array by key
  sortBy: (array, key, order = 'asc') => {
    return array.sort((a, b) => {
      if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Chunk array into smaller arrays
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Find item by property value
  findBy: (array, key, value) => {
    return array.find(item => item[key] === value);
  }
};

// Object utilities
export const ObjectUtils = {
  // Deep clone object
  clone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Merge objects deeply
  merge: (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        ObjectUtils.merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  },

  // Check if object is empty
  isEmpty: (obj) => {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
  },

  // Pick specific properties from object
  pick: (obj, keys) => {
    const result = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omit specific properties from object
  omit: (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }
};

// Medical-specific utilities
export const MedicalUtils = {
  // Calculate BMI
  calculateBMI: (weight, height) => {
    if (!weight || !height) return null;
    // weight in kg, height in meters
    return NumberUtils.round(weight / (height * height), 1);
  },

  // Assess BMI category
  assessBMI: (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  },

  // Calculate heart rate zones
  getHeartRateZones: (age) => {
    const maxHR = 220 - age;
    return {
      resting: Math.round(maxHR * 0.5),
      moderate: Math.round(maxHR * 0.7),
      vigorous: Math.round(maxHR * 0.85),
      maximum: maxHR
    };
  },

  // Validate vital signs ranges
  validateVitalSigns: (vitalSigns) => {
    const warnings = [];

    if (vitalSigns.heartRate) {
      if (vitalSigns.heartRate < 40) warnings.push('Bradycardia - very low heart rate');
      if (vitalSigns.heartRate > 120) warnings.push('Tachycardia - very high heart rate');
    }

    if (vitalSigns.respiratoryRate) {
      if (vitalSigns.respiratoryRate < 8) warnings.push('Bradypnea - very low respiratory rate');
      if (vitalSigns.respiratoryRate > 24) warnings.push('Tachypnea - very high respiratory rate');
    }

    if (vitalSigns.bloodPressure) {
      const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
      if (systolic < 90) warnings.push('Hypotension - low blood pressure');
      if (systolic > 140) warnings.push('Hypertension - high blood pressure');
    }

    if (vitalSigns.oxygenSaturation) {
      if (vitalSigns.oxygenSaturation < 92) warnings.push('Hypoxia - low oxygen saturation');
    }

    return warnings;
  },

  // Generate triage color based on level
  getTriageColor: (triageLevel) => {
    const colors = {
      IMMEDIATE: 'red',
      DELAYED: 'orange',
      MINOR: 'yellow',
      EXPECTANT: 'gray'
    };
    return colors[triageLevel] || 'gray';
  }
};

// File and Storage utilities
export const FileUtils = {
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate file type
  isValidFileType: (file, allowedTypes) => {
    if (!file || !allowedTypes) return false;
    return allowedTypes.includes(file.type);
  },

  // Validate file size
  isValidFileSize: (file, maxSizeMB) => {
    if (!file || !maxSizeMB) return false;
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  // Read file as data URL
  readAsDataURL: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Download data as file
  downloadFile: (data, filename, type = 'text/plain') => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Network utilities
export const NetworkUtils = {
  // Check if online
  isOnline: () => navigator.onLine,

  // Check connection type
  getConnectionType: () => {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType;
    }
    return 'unknown';
  },

  // Check if connection is slow
  isSlowConnection: () => {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType === 'slow-2g' || 
             navigator.connection.effectiveType === '2g';
    }
    return false;
  },

  // Debounce function for API calls
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Retry function with exponential backoff
  retry: async (fn, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return NetworkUtils.retry(fn, retries - 1, delay * 2);
    }
  }
};

// Export all utilities as a single object
export default {
  DateUtils,
  StringUtils,
  NumberUtils,
  ArrayUtils,
  ObjectUtils,
  MedicalUtils,
  FileUtils,
  NetworkUtils
};