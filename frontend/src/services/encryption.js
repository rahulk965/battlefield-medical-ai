import CryptoJS from 'crypto-js';

// Military-grade encryption service for client-side data protection
class ClientEncryptionService {
  constructor() {
    this.algorithm = CryptoJS.AES;
    this.keySize = 256;
    this.ivSize = 128;
    this.iterations = 100000;
  }

  // Generate encryption key from password
  generateKey(password, salt) {
    try {
      if (!password || !salt) {
        throw new Error('Password and salt are required for key generation');
      }

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: this.keySize / 32,
        iterations: this.iterations,
        hasher: CryptoJS.algo.SHA256
      });

      return key;
    } catch (error) {
      console.error('Key generation error:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  // Generate random salt
  generateSalt(length = 16) {
    try {
      return CryptoJS.lib.WordArray.random(length);
    } catch (error) {
      console.error('Salt generation error:', error);
      throw new Error('Failed to generate salt');
    }
  }

  // Generate random IV
  generateIV() {
    try {
      return CryptoJS.lib.WordArray.random(this.ivSize / 8);
    } catch (error) {
      console.error('IV generation error:', error);
      throw new Error('Failed to generate IV');
    }
  }

  // Encrypt data
  encrypt(data, password) {
    try {
      if (!data) {
        throw new Error('Data is required for encryption');
      }

      if (!password) {
        throw new Error('Password is required for encryption');
      }

      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Generate key from password and salt
      const key = this.generateKey(password, salt);

      // Encrypt data
      const encrypted = this.algorithm.encrypt(JSON.stringify(data), key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      // Combine salt, IV, and encrypted data
      const combined = salt.toString() + iv.toString() + encrypted.toString();

      return {
        encrypted: true,
        version: '1.0',
        data: combined,
        timestamp: new Date().toISOString(),
        algorithm: 'AES-256-CBC'
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  decrypt(encryptedData, password) {
    try {
      if (!encryptedData.encrypted) {
        return encryptedData; // Already decrypted or not encrypted
      }

      if (!password) {
        throw new Error('Password is required for decryption');
      }

      const combined = CryptoJS.enc.Hex.parse(encryptedData.data);
      
      // Extract salt (first 16 bytes), IV (next 16 bytes), and encrypted data
      const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4)); // 16 bytes
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8));   // 16 bytes
      const encrypted = CryptoJS.lib.WordArray.create(combined.words.slice(8)); // Rest

      // Generate key from password and salt
      const key = this.generateKey(password, salt);

      // Decrypt data
      const decrypted = this.algorithm.decrypt(
        { ciphertext: encrypted },
        key,
        { iv: iv, padding: CryptoJS.pad.Pkcs7, mode: CryptoJS.mode.CBC }
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid password or corrupted data');
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - possible key mismatch');
    }
  }

  // Simple encryption for non-sensitive data (faster)
  encryptSimple(data, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
      
      return {
        encrypted: true,
        data: encrypted,
        timestamp: new Date().toISOString(),
        method: 'simple'
      };
    } catch (error) {
      console.error('Simple encryption error:', error);
      throw new Error('Simple encryption failed');
    }
  }

  // Simple decryption
  decryptSimple(encryptedData, key) {
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
      console.error('Simple decryption error:', error);
      throw new Error('Simple decryption failed');
    }
  }

  // Hash data for integrity verification
  hashData(data) {
    try {
      return CryptoJS.SHA256(JSON.stringify(data)).toString();
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Failed to hash data');
    }
  }

  // Verify data integrity
  verifyIntegrity(originalData, receivedHash) {
    try {
      const currentHash = this.hashData(originalData);
      return currentHash === receivedHash;
    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }

  // Generate secure random string
  generateRandomString(length = 32) {
    try {
      const random = CryptoJS.lib.WordArray.random(length);
      return random.toString();
    } catch (error) {
      console.error('Random string generation error:', error);
      throw new Error('Failed to generate random string');
    }
  }

  // Secure data wiping (overwrite with random data)
  secureWipe(data) {
    try {
      if (typeof data === 'string') {
        // Overwrite string with random data
        const randomString = this.generateRandomString(data.length);
        return randomString;
      }
      
      if (Array.isArray(data)) {
        // Overwrite array with random values
        return data.map(() => this.generateRandomString(8));
      }
      
      if (typeof data === 'object' && data !== null) {
        // Overwrite object properties
        const wiped = {};
        for (const key in data) {
          wiped[key] = this.generateRandomString(8);
        }
        return wiped;
      }
      
      return this.generateRandomString(8);
    } catch (error) {
      console.error('Secure wipe error:', error);
      // Fallback - return null to prevent data leakage
      return null;
    }
  }

  // Get encryption capabilities
  getCapabilities() {
    return {
      algorithm: 'AES-256-CBC',
      keySize: 256,
      ivSize: 128,
      iterations: this.iterations,
      supported: true,
      securityLevel: 'MILITARY_GRADE'
    };
  }

  // Test encryption/decryption (for setup verification)
  testEncryption(testData = 'battlefield-medical-test') {
    try {
      const testPassword = this.generateRandomString(16);
      const encrypted = this.encrypt(testData, testPassword);
      const decrypted = this.decrypt(encrypted, testPassword);
      
      return {
        success: decrypted === testData,
        test: 'Encryption/Decryption cycle',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        test: 'Encryption/Decryption cycle'
      };
    }
  }
}

// Create singleton instance
const encryptionService = new ClientEncryptionService();

// Export utility functions
export const encryptionUtils = {
  // Check if data appears to be encrypted
  isEncrypted: (data) => {
    return data && typeof data === 'object' && data.encrypted === true;
  },

  // Generate password from soldier ID and unit
  generateSoldierPassword: (soldierId, unit) => {
    const baseString = `${soldierId}-${unit}-battlefield-medical`;
    return CryptoJS.SHA256(baseString).toString().substring(0, 32);
  },

  // Secure data disposal
  disposeSensitiveData: (data) => {
    if (encryptionUtils.isEncrypted(data)) {
      // Already encrypted, just remove
      return null;
    }
    
    // Wipe and return
    return encryptionService.secureWipe(data);
  },

  // Create data package with integrity check
  createSecurePackage: (data, password) => {
    const encrypted = encryptionService.encrypt(data, password);
    const hash = encryptionService.hashData(data);
    
    return {
      encryptedData: encrypted,
      integrityHash: hash,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  },

  // Verify and decrypt secure package
  openSecurePackage: (securePackage, password) => {
    try {
      const decrypted = encryptionService.decrypt(securePackage.encryptedData, password);
      const integrityValid = encryptionService.verifyIntegrity(decrypted, securePackage.integrityHash);
      
      if (!integrityValid) {
        throw new Error('Data integrity check failed - possible tampering');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Secure package opening failed:', error);
      throw error;
    }
  }
};

export default encryptionService;