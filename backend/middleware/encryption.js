import CryptoJS from 'crypto-js';

class RequestEncryption {
  static encryptResponse(data, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        key
      ).toString();
      
      return {
        encrypted: true,
        data: encrypted,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Response encryption error:', error);
      return data; // Fallback to unencrypted
    }
  }

  static decryptRequest(encryptedData, key) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or data');
      }
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Request decryption error:', error);
      throw new Error('Failed to decrypt request data');
    }
  }

  static middleware = (req, res, next) => {
    // Encrypt responses if encryption header is present
    const originalSend = res.send;
    
    res.send = function(data) {
      const encryptHeader = req.headers['x-require-encryption'];

      if (encryptHeader === 'true' && process.env.ENCRYPTION_KEY) {
        let payload = data;

        // If data is a string, try to parse only when content-type indicates JSON
        const contentType = res.getHeader ? res.getHeader('Content-Type') : req.headers['content-type'];
        if (typeof data === 'string' && contentType && contentType.toLowerCase().includes('application/json')) {
          try {
            payload = JSON.parse(data);
          } catch (err) {
            // If parsing fails, fallback to sending original data unencrypted
            console.warn('Response encryption: failed to parse JSON string, skipping encryption');
            return originalSend.call(this, data);
          }
        } else if (typeof data === 'string') {
          // Non-JSON string - do not attempt encryption
          return originalSend.call(this, data);
        }

        const encryptedData = RequestEncryption.encryptResponse(payload, process.env.ENCRYPTION_KEY);
        originalSend.call(this, encryptedData);
      } else {
        originalSend.call(this, data);
      }
    };
    
    next();
  };
}

export default RequestEncryption;