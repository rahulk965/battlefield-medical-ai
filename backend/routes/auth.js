import express from 'express';
import bcrypt from 'bcryptjs';
import MilitaryAuth from '../middleware/auth.js';

const router = express.Router();

// Mock soldier database - in production, use real database
const mockSoldiers = {
  'soldier-001': {
    soldierId: 'soldier-001',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    unit: 'Alpha Company',
    rank: 'sergeant',
    name: 'John Doe',
    status: 'active'
  },
  'medic-001': {
    soldierId: 'medic-001', 
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    unit: 'Medical Corps',
    rank: 'medic',
    name: 'Dr. Jane Smith',
    status: 'active'
  }
};

// Soldier authentication
router.post('/login', async (req, res) => {
  try {
    const { soldierId, password, deviceInfo } = req.body;

    if (!soldierId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Soldier ID and password are required'
      });
    }

    // Find soldier in mock database
    const soldier = mockSoldiers[soldierId];
    if (!soldier) {
      return res.status(401).json({
        success: false,
        error: 'Invalid soldier credentials'
      });
    }

    // Verify password - in real app, use proper hashing
    const isValidPassword = await bcrypt.compare(password, soldier.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid soldier credentials'
      });
    }

    // Generate military-grade token
    const token = MilitaryAuth.generateToken(
      soldier.soldierId,
      soldier.unit,
      soldier.rank,
      deviceInfo || {}
    );

    // Log authentication event
    console.log(`🔐 Soldier ${soldierId} authenticated from unit ${soldier.unit}`);

    res.json({
      success: true,
      data: {
        token,
        soldier: {
          soldierId: soldier.soldierId,
          unit: soldier.unit,
          rank: soldier.rank,
          name: soldier.name,
          permissions: MilitaryAuth.getPermissions(soldier.rank)
        },
        expiresIn: '8h'
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication system error',
      offlineFallback: true
    });
  }
});

// Emergency access token (for battlefield situations)
router.post('/emergency-access', async (req, res) => {
  try {
    const { emergencyCode, location, deviceInfo } = req.body;

    // Simple emergency code validation - in production, use proper emergency protocols
    const validEmergencyCodes = ['REDCROSS', 'MEDEVAC', '911BATTLEFIELD'];
    
    if (!emergencyCode || !validEmergencyCodes.includes(emergencyCode)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid emergency access code'
      });
    }

    // Generate limited emergency token
    const token = MilitaryAuth.generateToken(
      'emergency-user',
      'Emergency Access',
      'emergency',
      deviceInfo || {}
    );

    console.log(`🚨 Emergency access granted from location: ${JSON.stringify(location)}`);

    res.json({
      success: true,
      data: {
        token,
        accessLevel: 'emergency',
        permissions: ['emergency:access', 'self:write'],
        expiresIn: '2h', // Shorter expiry for emergency access
        restrictions: ['Limited functionality', 'No record viewing']
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Emergency access error:', error);
    res.status(500).json({
      success: false,
      error: 'Emergency access system error',
      offlineFallback: true
    });
  }
});

// Token verification endpoint
router.post('/verify', MilitaryAuth.authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      soldier: req.soldier,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours from now
    },
    timestamp: new Date()
  });
});

// Token refresh
router.post('/refresh', MilitaryAuth.authenticate, (req, res) => {
  try {
    const newToken = MilitaryAuth.generateToken(
      req.soldier.soldierId,
      req.soldier.unit,
      req.soldier.rank,
      req.headers['x-device-fingerprint'] ? { fingerprint: req.headers['x-device-fingerprint'] } : {}
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: '8h'
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

// Logout (client-side token invalidation)
router.post('/logout', MilitaryAuth.authenticate, (req, res) => {
  console.log(`🔓 Soldier ${req.soldier.soldierId} logged out`);
  
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date()
  });
});

// Password reset request (simplified for demo)
router.post('/reset-password', async (req, res) => {
  try {
    const { soldierId, birthDate, lastFourSSN } = req.body;

    // Simple validation - in production, use proper identity verification
    if (!soldierId || !birthDate) {
      return res.status(400).json({
        success: false,
        error: 'Soldier ID and birth date are required'
      });
    }

    // Mock verification - always succeeds in demo
    console.log(`🔐 Password reset requested for soldier: ${soldierId}`);

    res.json({
      success: true,
      message: 'Password reset instructions sent to registered device',
      resetToken: 'demo-reset-token', // In production, generate secure reset token
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset system error'
    });
  }
});

// Get current user profile
router.get('/profile', MilitaryAuth.authenticate, (req, res) => {
  const soldier = mockSoldiers[req.soldier.soldierId];
  
  if (!soldier) {
    return res.status(404).json({
      success: false,
      error: 'Soldier profile not found'
    });
  }

  res.json({
    success: true,
    data: {
      soldierId: soldier.soldierId,
      name: soldier.name,
      unit: soldier.unit,
      rank: soldier.rank,
      status: soldier.status,
      permissions: MilitaryAuth.getPermissions(soldier.rank),
      lastLogin: new Date()
    },
    timestamp: new Date()
  });
});

export default router;