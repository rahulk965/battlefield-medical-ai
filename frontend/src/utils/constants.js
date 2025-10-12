// Battlefield Medical Assistant - Constants and Configuration

// Application Constants
export const APP_CONSTANTS = {
  NAME: 'Battlefield Medical Assistant',
  VERSION: '1.0.0',
  BUILD: '2024.01.001',
  AUTHOR: 'Military Medical Corps',
  SUPPORT_EMAIL: 'support@battlefield-medical.mil',
  
  // Security
  ENCRYPTION_LEVEL: 'MILITARY_GRADE',
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  EMERGENCY_SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  
  // Storage
  MAX_LOCAL_STORAGE: 50 * 1024 * 1024, // 50MB
  MAX_INDEXEDDB_SIZE: 500 * 1024 * 1024, // 500MB
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Medical Triage Levels
export const TRIAGE_LEVELS = {
  IMMEDIATE: {
    value: 'IMMEDIATE',
    label: 'Immediate',
    color: 'red',
    priority: 1,
    description: 'Life-threatening injuries requiring immediate intervention',
    evacuation: 'Within 1 hour',
    examples: ['Airway obstruction', 'Massive hemorrhage', 'Tension pneumothorax']
  },
  DELAYED: {
    value: 'DELAYED',
    label: 'Delayed', 
    color: 'orange',
    priority: 2,
    description: 'Serious injuries not immediately life-threatening',
    evacuation: 'Within 2-4 hours',
    examples: ['Major fractures', 'Burns 15-40%', 'Soft tissue injuries']
  },
  MINOR: {
    value: 'MINOR',
    label: 'Minor',
    color: 'yellow',
    priority: 3,
    description: 'Walking wounded with minor injuries',
    evacuation: 'When resources available',
    examples: ['Minor lacerations', 'Contusions', 'Sprains']
  },
  EXPECTANT: {
    value: 'EXPECTANT',
    label: 'Expectant',
    color: 'gray',
    priority: 4,
    description: 'Victims unlikely to survive given available resources',
    evacuation: 'Comfort care',
    examples: ['Unsurvivable injuries', 'Cardiac arrest in trauma']
  }
};

// Military Ranks and Permissions
export const MILITARY_RANKS = {
  PRIVATE: {
    rank: 'private',
    permissions: ['self:read', 'self:write', 'emergency:access'],
    description: 'Basic soldier access'
  },
  CORPORAL: {
    rank: 'corporal', 
    permissions: ['squad:read', 'medic:access', 'triage:basic'],
    description: 'Squad leader access'
  },
  SERGEANT: {
    rank: 'sergeant',
    permissions: ['platoon:read', 'medic:write', 'triage:advanced'],
    description: 'Platoon leader access'
  },
  MEDIC: {
    rank: 'medic',
    permissions: ['all:read', 'medic:write', 'triage:expert'],
    description: 'Medical corps access'
  },
  OFFICER: {
    rank: 'officer',
    permissions: ['all:read', 'all:write', 'system:access'],
    description: 'Command level access'
  }
};

// Emergency Protocols
export const EMERGENCY_PROTOCOLS = {
  MASS_CASUALTY: {
    id: 'mass_casualty',
    name: 'Mass Casualty Incident',
    triggers: ['>10 casualties', 'Multiple severe injuries', 'Resource shortage'],
    procedures: [
      'Activate mass casualty protocol',
      'Establish triage area',
      'Prioritize resource allocation',
      'Coordinate evacuation',
      'Document all actions'
    ]
  },
  CHEMICAL_EXPOSURE: {
    id: 'chemical_exposure',
    name: 'Chemical/Biological Exposure',
    triggers: ['Chemical attack', 'Unknown substance exposure', 'Mass symptoms'],
    procedures: [
      'Don protective equipment',
      'Establish decontamination zone',
      'Isolate contaminated individuals',
      'Provide antidotes if available',
      'Evacuate to specialized facility'
    ]
  },
  COMBAT_TRAUMA: {
    id: 'combat_trauma', 
    name: 'Combat Trauma Response',
    triggers: ['Gunshot wounds', 'Blast injuries', 'Shrapnel wounds'],
    procedures: [
      'Apply tactical combat casualty care',
      'Control hemorrhage immediately',
      'Manage airway and breathing',
      'Treat tension pneumothorax',
      'Rapid evacuation to surgical facility'
    ]
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    REFRESH: '/auth/refresh',
    EMERGENCY_ACCESS: '/auth/emergency-access'
  },
  DIAGNOSIS: {
    ANALYZE: '/diagnose/analyze',
    TRIAGE: '/diagnose/triage',
    MASS_CASUALTY: '/diagnose/mass-casualty'
  },
  INJURY: {
    DETECT: '/injury/detect',
    BULK_DETECT: '/injury/bulk-detect',
    CAPABILITIES: '/injury/capabilities'
  },
  RECORDS: {
    SAVE: '/records/save',
    SOLDIER_RECORDS: '/records/soldier',
    SYNC: '/records/sync',
    EMERGENCY: '/records/emergency/recent',
    SEARCH: '/records/search',
    SYNC_STATUS: '/records/sync-status'
  },
  SYSTEM: {
    STATUS: '/status',
    EMERGENCY_STATUS: '/emergency-status'
  }
};

// Error Codes and Messages
export const ERROR_CODES = {
  // Authentication Errors
  AUTH_001: 'Invalid soldier credentials',
  AUTH_002: 'Session expired',
  AUTH_003: 'Insufficient permissions',
  AUTH_004: 'Device verification failed',
  
  // Medical Errors
  MED_001: 'Symptoms analysis failed',
  MED_002: 'Image processing error',
  MED_003: 'Invalid vital signs data',
  MED_004: 'Triage assessment unavailable',
  
  // System Errors
  SYS_001: 'Database connection failed',
  SYS_002: 'Encryption service unavailable',
  SYS_003: 'Offline storage full',
  SYS_004: 'Sync service unavailable',
  
  // Network Errors
  NET_001: 'Network unavailable',
  NET_002: 'Request timeout',
  NET_003: 'Server unreachable',
  NET_004: 'Rate limit exceeded'
};

// UI Configuration
export const UI_CONFIG = {
  // Colors
  COLORS: {
    PRIMARY: '#1a202c',
    SECONDARY: '#2d3748',
    ACCENT: '#e53e3e',
    SUCCESS: '#38a169',
    WARNING: '#d69e2e',
    DANGER: '#e53e3e',
    INFO: '#3182ce'
  },
  
  // Breakpoints
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  },
  
  // Animation
  ANIMATION: {
    DURATION: {
      FAST: '150ms',
      NORMAL: '300ms',
      SLOW: '500ms'
    },
    TIMING: {
      EASE: 'ease',
      EASE_IN: 'ease-in',
      EASE_OUT: 'ease-out',
      EASE_IN_OUT: 'ease-in-out'
    }
  },
  
  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    MODAL: 1030,
    POPOVER: 1040,
    TOOLTIP: 1050,
    EMERGENCY: 1060
  }
};

// Feature Flags
export const FEATURE_FLAGS = {
  AI_DIAGNOSIS: true,
  IMAGE_ANALYSIS: true,
  VOICE_INPUT: true,
  OFFLINE_MODE: true,
  ENCRYPTION: true,
  SYNC: true,
  PWA: true,
  EMERGENCY_MODE: true
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH: 'battlefield_auth',
  SETTINGS: 'battlefield_settings',
  EMERGENCY_MODE: 'emergency_mode',
  DEVICE_FINGERPRINT: 'device_fingerprint',
  OFFLINE_DATA: 'offline_data_cache',
  SYNC_QUEUE: 'sync_queue'
};

// Export all constants as a single object for easy importing
export default {
  APP_CONSTANTS,
  TRIAGE_LEVELS,
  MILITARY_RANKS,
  EMERGENCY_PROTOCOLS,
  API_ENDPOINTS,
  ERROR_CODES,
  UI_CONFIG,
  FEATURE_FLAGS,
  STORAGE_KEYS
};