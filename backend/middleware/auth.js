import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class MilitaryAuth {
  static authenticate = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Bearer token missing'
        });
      }

      const token = authHeader.split(' ')[1];
      const deviceFingerprint = req.headers['x-device-fingerprint'];
      
      if (!deviceFingerprint) {
        return res.status(401).json({
          error: 'Device verification required',
          message: 'Device fingerprint header missing'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Enhanced device fingerprint verification
      if (decoded.deviceFingerprint !== deviceFingerprint) {
        console.warn(`Device fingerprint mismatch for soldier: ${decoded.soldierId}`);
        return res.status(401).json({
          error: 'Device verification failed',
          message: 'Invalid device fingerprint'
        });
      }

      // Check token expiration with buffer
      const now = Date.now() / 1000;
      if (decoded.exp - now < 300) { // 5 minutes remaining
        console.log(`Token nearing expiration for soldier: ${decoded.soldierId}`);
      }

      req.soldier = decoded;
      next();
      
    } catch (error) {
      console.error('Authentication error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please re-authenticate'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token verification failed'
        });
      }

      res.status(500).json({
        error: 'Authentication system error',
        offlineFallback: true
      });
    }
  };

  static generateToken(soldierId, unit, rank, deviceInfo) {
    const deviceFingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(deviceInfo) + Date.now())
      .digest('hex');

    const payload = {
      soldierId,
      unit,
      rank,
      deviceFingerprint,
      timestamp: Date.now(),
      permissions: this.getPermissions(rank)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
      issuer: 'battlefield-medical-system',
      subject: soldierId
    });
  }

  static getPermissions(rank) {
    const permissions = {
      basic: ['self:read', 'self:write', 'emergency:access'],
      medic: ['medic:read', 'medic:write', 'triage:access'],
      officer: ['all:read', 'all:write', 'system:access']
    };

    return permissions[rank] || permissions.basic;
  }

  static verifyPermissions(req, requiredPermission) {
    const soldierPermissions = req.soldier?.permissions || [];
    
    if (!soldierPermissions.includes(requiredPermission)) {
      throw new Error(`Insufficient permissions. Required: ${requiredPermission}`);
    }
    
    return true;
  }
}

export default MilitaryAuth;