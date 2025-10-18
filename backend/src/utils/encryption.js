const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const argon2 = require('argon2');

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  saltLength: 16,
  tagLength: 16
};

// Get encryption key from environment or generate one
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  
  // In production, this should be stored securely
  console.warn('⚠️  No ENCRYPTION_KEY found, using default key for development');
  return crypto.scryptSync('5elm-default-key', 'salt', ENCRYPTION_CONFIG.keyLength);
};

const ENCRYPTION_KEY = getEncryptionKey();

// Encrypt sensitive data
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_KEY);
    cipher.setAAD(Buffer.from('5elm-aad'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, ENCRYPTION_KEY);
    decipher.setAAD(Buffer.from('5elm-aad'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hash passwords with Argon2 (more secure than bcrypt)
const hashPassword = async (password) => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1
    });
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
};

// Verify passwords with Argon2
const verifyPassword = async (password, hash) => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

// Generate secure random tokens
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive identifiers (like email addresses for searching)
const hashIdentifier = (identifier) => {
  return crypto.createHash('sha256').update(identifier.toLowerCase()).digest('hex');
};

// Encrypt personal identifiable information (PII)
const encryptPII = (data) => {
  if (typeof data === 'object' && data !== null) {
    const encrypted = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        encrypted[key] = encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }
    return encrypted;
  }
  return encrypt(data);
};

// Decrypt personal identifiable information (PII)
const decryptPII = (encryptedData) => {
  if (typeof encryptedData === 'object' && encryptedData !== null) {
    const decrypted = {};
    for (const [key, value] of Object.entries(encryptedData)) {
      if (value && typeof value === 'string' && value.includes(':')) {
        try {
          decrypted[key] = decrypt(value);
        } catch (error) {
          // If decryption fails, assume it's not encrypted
          decrypted[key] = value;
        }
      } else {
        decrypted[key] = value;
      }
    }
    return decrypted;
  }
  return decrypt(encryptedData);
};

// Generate encryption key for environment
const generateEncryptionKey = () => {
  const key = crypto.randomBytes(ENCRYPTION_CONFIG.keyLength);
  return key.toString('hex');
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashIdentifier,
  encryptPII,
  decryptPII,
  generateEncryptionKey,
  ENCRYPTION_CONFIG
};
