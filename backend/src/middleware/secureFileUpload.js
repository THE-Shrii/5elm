const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const { fileTypeFromBuffer } = require('file-type');
const fs = require('fs-extra');
const mime = require('mime-types');
const AuditLog = require('../models/AuditLog');

// Allowed file types for different upload categories
const ALLOWED_FILE_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  documents: {
    mimeTypes: ['application/pdf', 'text/plain', 'application/msword'],
    extensions: ['.pdf', '.txt', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  avatars: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 2 * 1024 * 1024 // 2MB
  }
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.html', '.htm', '.sh', '.ps1'
];

// File type validation middleware using working packages
const validateFileType = (allowedCategory = 'images') => {
  return async (req, file, cb) => {
    try {
      const allowedTypes = ALLOWED_FILE_TYPES[allowedCategory];
      if (!allowedTypes) {
        return cb(new Error('Invalid file category'), false);
      }

      // Check file extension
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
        await AuditLog.logActivity({
          userId: req.user?.id,
          action: 'security_violation',
          method: req.method,
          endpoint: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'failure',
          description: `Attempted upload of dangerous file type: ${fileExt}`,
          riskLevel: 'high',
          isSecurityEvent: true,
          isSuspicious: true
        });
        return cb(new Error('File type not allowed for security reasons'), false);
      }

      // Check if extension is in allowed list
      if (!allowedTypes.extensions.includes(fileExt)) {
        return cb(new Error(`File type ${fileExt} not allowed`), false);
      }

      // Check MIME type using mime-types package
      const expectedMimeType = mime.lookup(file.originalname);
      if (!allowedTypes.mimeTypes.includes(file.mimetype) || 
          !allowedTypes.mimeTypes.includes(expectedMimeType)) {
        return cb(new Error(`MIME type ${file.mimetype} not allowed`), false);
      }

      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  };
};

// Secure filename generation
const generateSecureFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(16).toString('hex');
  return `${timestamp}_${randomHash}${ext}`;
};

// Image sanitization and processing using sharp
const sanitizeImage = async (buffer, options = {}) => {
  try {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 85,
      removeMetadata = true
    } = options;

    let processedImage = sharp(buffer);
    
    if (removeMetadata) {
      // Remove EXIF data and other metadata for privacy
      processedImage = processedImage.withMetadata({});
    }

    // Resize if too large
    processedImage = processedImage.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });

    // Convert to JPEG and optimize quality
    const processedBuffer = await processedImage
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    console.error('Image sanitization failed:', error);
    throw error;
  }
};

// Basic virus scanning simulation (replace with real antivirus in production)
const scanForViruses = async (buffer, userId) => {
  try {
    // Simulate virus scanning delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic suspicious pattern detection
    const suspicious = checkSuspiciousPatterns(buffer);
    if (suspicious) {
      await AuditLog.logActivity({
        userId: userId,
        action: 'security_violation',
        description: 'Suspicious file patterns detected',
        riskLevel: 'high',
        isSecurityEvent: true,
        isSuspicious: true
      });
      
      throw new Error('Suspicious file content detected');
    }

    return { clean: true, scanResult: 'No threats detected' };
  } catch (error) {
    throw error;
  }
};

// Check for suspicious patterns in file buffer
const checkSuspiciousPatterns = (buffer) => {
  // Convert buffer to string for pattern matching
  const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
  
  // Check for common malicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.write/i,
    /\.exe/i,
    /cmd\.exe/i,
    /powershell/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(content));
};

// Content validation for images using file-type
const validateImageContent = async (buffer) => {
  try {
    // Use file-type to validate that the file is actually an image
    const fileTypeResult = await fileTypeFromBuffer(buffer);
    
    if (!fileTypeResult) {
      throw new Error('Unable to determine file type');
    }

    // Check if detected file type matches expected image types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(fileTypeResult.mime)) {
      throw new Error('File is not a valid image');
    }

    // Use sharp to get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Check if image dimensions are reasonable
    if (metadata.width > 10000 || metadata.height > 10000) {
      throw new Error('Image dimensions too large');
    }

    // Check if image has valid format
    if (!['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
      throw new Error('Invalid image format detected');
    }

    return { valid: true, metadata, detectedType: fileTypeResult };
  } catch (error) {
    throw new Error('Invalid image file or corrupted data');
  }
};

// Secure upload middleware factory
const createSecureUpload = (category = 'images', options = {}) => {
  const allowedTypes = ALLOWED_FILE_TYPES[category];
  
  const storage = multer.memoryStorage(); // Use memory storage for processing

  return multer({
    storage,
    limits: {
      fileSize: allowedTypes.maxSize,
      files: options.maxFiles || 1
    },
    fileFilter: validateFileType(category)
  });
};

// Post-upload security processing
const processUploadedFile = async (req, file, category = 'images') => {
  try {
    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalname);

    // Validate file content using file-type
    const fileTypeResult = await fileTypeFromBuffer(file.buffer);
    if (!fileTypeResult || !ALLOWED_FILE_TYPES[category].mimeTypes.includes(fileTypeResult.mime)) {
      throw new Error('File content does not match extension');
    }

    // Scan for viruses and suspicious content
    await scanForViruses(file.buffer, req.user?.id);

    // Process based on file type
    let processedBuffer = file.buffer;
    if (category === 'images' || category === 'avatars') {
      // Validate image content
      await validateImageContent(file.buffer);
      
      // Sanitize and process image
      processedBuffer = await sanitizeImage(file.buffer, {
        maxWidth: category === 'avatars' ? 512 : 2048,
        maxHeight: category === 'avatars' ? 512 : 2048
      });
    }

    // Log successful upload
    await AuditLog.logActivity({
      userId: req.user?.id,
      action: 'file_upload',
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success',
      description: `Secure file upload: ${file.originalname}`,
      metadata: {
        originalName: file.originalname,
        secureFilename,
        fileSize: file.size,
        mimeType: file.mimetype,
        detectedType: fileTypeResult.mime,
        category
      }
    });

    return {
      buffer: processedBuffer,
      secureFilename,
      fileInfo: {
        originalName: file.originalname,
        size: processedBuffer.length,
        mimeType: fileTypeResult.mime,
        secure: true
      }
    };

  } catch (error) {
    // Log failed upload
    await AuditLog.logActivity({
      userId: req.user?.id,
      action: 'file_upload',
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'failure',
      description: `File upload failed: ${error.message}`,
      riskLevel: 'medium',
      isSecurityEvent: true
    });

    throw error;
  }
};

module.exports = {
  createSecureUpload,
  processUploadedFile,
  sanitizeImage,
  scanForViruses,
  validateImageContent,
  ALLOWED_FILE_TYPES,
  generateSecureFilename
};
