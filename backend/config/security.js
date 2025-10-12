import crypto from 'crypto';

// Military-grade security configuration
export const securityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 64,
    iterations: 100000,
    digest: 'sha512'
  },
  jwt: {
    expiresIn: '8h',
    issuer: 'battlefield-medical-system',
    audience: 'military-personnel'
  },
  rateLimiting: {
    auth: {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 5
    },
    api: {
      windowMs: 60 * 1000,
      maxRequests: 100
    }
  }
};

// Generate secure keys
export const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateDeviceFingerprint = (userAgent, acceptHeaders) => {
  const data = userAgent + acceptHeaders + Date.now();
  return crypto.createHash('sha256').update(data).digest('hex');
};