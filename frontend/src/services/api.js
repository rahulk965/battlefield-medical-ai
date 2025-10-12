import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_ENV === 'production' 
  ? '/api' 
  : import.meta.env.VITE_API_URL;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and device fingerprint
apiClient.interceptors.request.use(
  (config) => {
    // Add device fingerprint
    const deviceFingerprint = localStorage.getItem('device_fingerprint') || generateDeviceFingerprint();
    config.headers['x-device-fingerprint'] = deviceFingerprint;

    // Add auth token if available
    const authData = getAuthData();
    if (authData && authData.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }

    // Add emergency mode header if active
    const emergencyMode = localStorage.getItem('emergency_mode') === 'true';
    if (emergencyMode) {
      config.headers['x-emergency-mode'] = 'true';
    }

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and offline mode
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response error:', error);

    // Handle network errors
    if (!error.response) {
      return handleOfflineError(error);
    }

    // Handle specific HTTP status codes
    switch (error.response.status) {
      case 401:
        handleUnauthorizedError();
        break;
      case 403:
        handleForbiddenError();
        break;
      case 429:
        handleRateLimitError(error);
        break;
      case 500:
        handleServerError(error);
        break;
      default:
        console.error('Unhandled API error:', error);
    }

    return Promise.reject(error);
  }
);

// Generate device fingerprint
function generateDeviceFingerprint() {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    screen.width,
    screen.height,
    Date.now()
  ].join('|');

  const hash = btoa(fingerprint).substring(0, 64);
  localStorage.setItem('device_fingerprint', hash);
  return hash;
}

// Get authentication data from storage
export function getAuthData() {
  try {
    const authData = localStorage.getItem('battlefield_auth');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Failed to parse auth data:', error);
    return null;
  }
}

// Handle offline errors
export function handleOfflineError(error) {
  console.log('🌐 Network unavailable - using offline mode');
  
  // Check if we have cached data for this request
  const cachedResponse = getCachedResponse(error.config);
  if (cachedResponse) {
    console.log('💾 Returning cached response');
    return Promise.resolve({ data: cachedResponse, fromCache: true });
  }

  // For critical endpoints, return offline fallback
  if (isCriticalEndpoint(error.config.url)) {
    const offlineResponse = createOfflineFallback(error.config);
    return Promise.resolve({ data: offlineResponse, offline: true });
  }

  return Promise.reject({
    ...error,
    offline: true,
    message: 'Network unavailable and no cached data'
  });
}

// Check if endpoint is critical for offline operation
function isCriticalEndpoint(url) {
  const criticalEndpoints = [
    '/diagnose/analyze',
    '/injury/detect',
    '/records/save'
  ];
  
  return criticalEndpoints.some(endpoint => url.includes(endpoint));
}

// Create offline fallback response
function createOfflineFallback(config) {
  const baseResponse = {
    success: true,
    offline: true,
    timestamp: new Date().toISOString(),
    message: 'Offline mode active - using local processing'
  };

  if (config.url.includes('/diagnose/analyze')) {
    return {
      ...baseResponse,
      data: {
        primaryDiagnosis: { diagnosis: 'Offline Assessment', confidence: 0.7 },
        triageLevel: 'MINOR',
        firstAidSteps: [
          "Provide basic first aid",
          "Monitor vital signs",
          "Seek medical assistance when connection available"
        ],
        emergencyActions: [],
        militaryContext: { combatRelated: false, evacuationPriority: 3 }
      }
    };
  }

  if (config.url.includes('/injury/detect')) {
    return {
      ...baseResponse,
      data: {
        success: true,
        injuries: [{
          injuryType: 'offline_analysis',
          confidence: 0.6,
          severity: 'unknown',
          description: 'Offline image analysis unavailable'
        }],
        overallAssessment: 'Offline mode - manual assessment required',
        firstAid: [
          "Clean and cover wound",
          "Monitor for infection",
          "Seek professional medical help"
        ]
      }
    };
  }

  return baseResponse;
}

// Get cached response (simple implementation)
function getCachedResponse(config) {
  const cacheKey = `api_cache_${config.url}_${JSON.stringify(config.data || {})}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    
    // Check if cache is still valid (5 minutes)
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  
  return null;
}

// Cache successful responses
function cacheResponse(config, response) {
  if (response.data && config.method?.toLowerCase() === 'get') {
    const cacheKey = `api_cache_${config.url}_${JSON.stringify(config.data || {})}`;
    const cacheData = {
      data: response.data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  }
}

// Error handlers
function handleUnauthorizedError() {
  console.log('🔐 Authentication required');
  localStorage.removeItem('battlefield_auth');
  window.dispatchEvent(new Event('auth-required'));
}

function handleForbiddenError() {
  console.log('🚫 Insufficient permissions');
  window.dispatchEvent(new Event('insufficient-permissions'));
}

function handleRateLimitError(error) {
  console.log('⏰ Rate limit exceeded');
  const retryAfter = error.response?.headers?.['retry-after'];
  
  if (retryAfter) {
    const retryTime = parseInt(retryAfter) * 1000;
    setTimeout(() => {
      window.location.reload();
    }, retryTime);
  }
}

function handleServerError(error) {
  console.log('🔧 Server error - attempting fallback');
  // Could implement retry logic here
}

// API service methods
export const apiService = {
  // Authentication
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    verify: () => apiClient.post('/auth/verify'),
    refresh: () => apiClient.post('/auth/refresh'),
    emergencyAccess: (code, location) => 
      apiClient.post('/auth/emergency-access', { emergencyCode: code, location })
  },

  // Medical Diagnosis
  diagnosis: {
    analyze: (symptoms, vitalSigns, location) =>
      apiClient.post('/diagnose/analyze', { symptoms, vitalSigns, location }),
    
    triage: (assessment) =>
      apiClient.post('/diagnose/triage', assessment),
    
    massCasualty: (casualties) =>
      apiClient.post('/diagnose/mass-casualty', { casualties })
  },

  // Injury Detection
  injury: {
    detect: (imageFile, mechanism, location) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (mechanism) formData.append('mechanism', mechanism);
      if (location) formData.append('location', JSON.stringify(location));
      
      return apiClient.post('/injury/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    
    bulkDetect: (imageFiles) => {
      const formData = new FormData();
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      return apiClient.post('/injury/bulk-detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    
    capabilities: () => apiClient.get('/injury/capabilities')
  },

  // Medical Records
  records: {
    save: (recordData) => apiClient.post('/records/save', recordData),
    
    getSoldierRecords: (soldierId, options = {}) =>
      apiClient.get(`/records/soldier/${soldierId}`, { params: options }),
    
    sync: (pendingRecords) => 
      apiClient.post('/records/sync', { pendingRecords }),
    
    getEmergency: (hours = 24) =>
      apiClient.get('/records/emergency/recent', { params: { hours } }),
    
    search: (filters) =>
      apiClient.get('/records/search', { params: filters }),
    
    getSyncStatus: () => apiClient.get('/records/sync-status')
  },

  // System Status
  system: {
    status: () => apiClient.get('/status'),
    emergencyStatus: () => apiClient.get('/emergency-status')
  }
};

// Utility functions
export const apiUtils = {
  // Check if response is from cache
  isCached: (response) => response.fromCache === true,
  
  // Check if response is from offline mode
  isOffline: (response) => response.offline === true,
  
  // Get error message from response
  getErrorMessage: (error) => {
    if (error.offline) {
      return 'Network unavailable - operating in offline mode';
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  },
  
  // Retry failed requests
  retry: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  },
  
  // Cancel request
  createCancelToken: () => axios.CancelToken.source(),
  
  // Check if request was cancelled
  isCancelled: (error) => axios.isCancel(error)
};

export default apiService;