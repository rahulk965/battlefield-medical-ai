import rateLimit from 'express-rate-limit';

// Military-grade rate limiting configurations
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
    code: 'RATE_LIMIT_AUTH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      message: 'Too many login attempts. Please wait 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: 'Too many requests',
    message: 'Please slow down your requests',
    code: 'RATE_LIMIT_API'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and status endpoints
    return req.url === '/api/status' || req.url === '/api/emergency-status';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'API rate limit exceeded',
      message: 'Too many requests from this IP address',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  }
});

export const emergencyRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10, // 10 emergency requests per 30 seconds
  message: {
    error: 'Emergency system overload',
    message: 'Emergency system is processing requests. Please wait.',
    code: 'RATE_LIMIT_EMERGENCY'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Emergency system rate limit exceeded',
      message: 'System is processing emergency requests. Please wait 30 seconds.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString(),
      offlineFallback: true
    });
  }
});

export const uploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 file uploads per 5 minutes
  message: {
    error: 'Too many file uploads',
    message: 'Please wait before uploading more files',
    code: 'RATE_LIMIT_UPLOAD'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiting based on system load
export const createDynamicRateLimiter = (baseWindowMs = 60000, baseMax = 100) => {
  return rateLimit({
    windowMs: baseWindowMs,
    max: (req) => {
      // Adjust rate limit based on system load
      const memoryUsage = process.memoryUsage();
      const memoryPressure = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (memoryPressure > 0.8) {
        return Math.floor(baseMax * 0.5); // Reduce by 50% under high memory pressure
      }
      
      return baseMax;
    },
    message: {
      error: 'System under load',
      message: 'Request rate adjusted due to system load',
      code: 'RATE_LIMIT_DYNAMIC'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

export default {
  auth: authRateLimiter,
  api: apiRateLimiter,
  emergency: emergencyRateLimiter,
  upload: uploadRateLimiter,
  dynamic: createDynamicRateLimiter
};