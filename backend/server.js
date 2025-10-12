import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - military grade
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '1 minute'
  }
});

// Database connection
connectDatabase();

// Routes
app.use('/api/auth', authLimiter, (await import('./routes/auth.js')).default);
app.use('/api/diagnose', apiLimiter, (await import('./routes/diagnosis.js')).default);
app.use('/api/injury', apiLimiter, (await import('./routes/injury.js')).default);
app.use('/api/records', apiLimiter, (await import('./routes/records.js')).default);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'operational', 
    service: 'Battlefield Medical AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    offline: false,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Emergency status endpoint
app.get('/api/emergency-status', (req, res) => {
  res.json({
    system: 'Battlefield Medical Assistant',
    status: 'ACTIVE',
    capabilities: {
      symptom_analysis: true,
      injury_detection: true,
      offline_mode: true,
      encryption: true,
      sync: true
    },
    last_updated: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('System Error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      offlineFallback: true
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    offlineFallback: true,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/status',
      '/api/emergency-status',
      '/api/auth/login',
      '/api/diagnose/analyze',
      '/api/injury/detect',
      '/api/records/save'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🛡️  Battlefield Medical Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/api/status`);
});

export default app;