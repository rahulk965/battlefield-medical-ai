import crypto from 'crypto';
import CryptoJS from 'crypto-js';

export class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyDerivation = {
      iterations: 100000,
      keyLength: 32,
      digest: 'sha512'
    };
  }

  // Generate encryption key from password
  async generateKeyFromPassword(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.keyDerivation.iterations,
        this.keyDerivation.keyLength,
        this.keyDerivation.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  // Generate random salt
  generateSalt(length = 64) {
    return crypto.randomBytes(length);
  }

  // Generate random IV
  generateIV() {
    return crypto.randomBytes(16);
  }

  // Encrypt data with military-grade encryption
  async encryptData(data, key) {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // Derive key from provided key and salt
      const derivedKey = await this.generateKeyFromPassword(key, salt);
      
      const cipher = crypto.createCipher(this.algorithm, derivedKey);
      cipher.setAAD(Buffer.from(JSON.stringify({ 
        timestamp: new Date().toISOString(),
        version: '1.0'
      })));
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: true,
        version: '1.0',
        algorithm: this.algorithm,
        data: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        authTag: authTag.toString('hex'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  async decryptData(encryptedData, key) {
    try {
      if (!encryptedData.encrypted) {
        return encryptedData; // Already decrypted or not encrypted
      }

      const { data, iv, salt, authTag } = encryptedData;
      
      const derivedKey = await this.generateKeyFromPassword(key, Buffer.from(salt, 'hex'));
      const decipher = crypto.createDecipher(this.algorithm, derivedKey);
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      decipher.setAAD(Buffer.from(JSON.stringify({
        timestamp: encryptedData.timestamp,
        version: encryptedData.version
      })));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - possible key mismatch or data corruption');
    }
  }

  // Client-side compatible encryption (for frontend)
  encryptClientSide(data, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
      
      return {
        encrypted: true,
        data: encrypted,
        timestamp: new Date().toISOString(),
        method: 'AES'
      };
    } catch (error) {
      console.error('Client-side encryption error:', error);
      throw new Error('Client-side encryption failed');
    }
  }

  // Client-side decryption
  decryptClientSide(encryptedData, key) {
    try {
      if (!encryptedData.encrypted) {
        return encryptedData;
      }

      const bytes = CryptoJS.AES.decrypt(encryptedData.data, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key');
      }
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Client-side decryption error:', error);
      throw new Error('Client-side decryption failed');
    }
  }

  // Hash data (for verification)
  hashData(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Verify data integrity
  verifyDataIntegrity(originalData, receivedHash) {
    const currentHash = this.hashData(originalData);
    return currentHash === receivedHash;
  }

  // Generate key pair for asymmetric encryption (future use)
  generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      });
    });
  }

  // Rotate encryption keys
  async rotateKey(oldKey, newKey, encryptedData) {
    try {
      // Decrypt with old key
      const decryptedData = await this.decryptData(encryptedData, oldKey);
      
      // Re-encrypt with new key
      const reencryptedData = await this.encryptData(decryptedData, newKey);
      
      return reencryptedData;
    } catch (error) {
      console.error('Key rotation error:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  // Get encryption info (for debugging and monitoring)
  getEncryptionInfo() {
    return {
      algorithm: this.algorithm,
      keyDerivation: this.keyDerivation,
      supportedMethods: ['AES-256-GCM', 'PBKDF2'],
      securityLevel: 'MILITARY_GRADE'
    };
  }
}

export default EncryptionService;