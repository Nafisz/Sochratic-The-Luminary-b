const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

class FileUploadService {
  constructor() {
    this.uploadDir = 'uploads/profiles';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  // Ensure upload directory exists
  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  // Configure multer for local storage
  getLocalStorage() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const userId = req.user.id;
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `user_${userId}_${timestamp}${extension}`;
        cb(null, filename);
      }
    });

    return multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
        }
      }
    });
  }

  // Configure multer for memory storage (for processing before saving)
  getMemoryStorage() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
        }
      }
    });
  }

  // Process and save image with optimization
  async processAndSaveImage(file, userId) {
    try {
      const timestamp = Date.now();
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `user_${userId}_${timestamp}${extension}`;
      const filepath = path.join(this.uploadDir, filename);

      // Process image with Sharp
      let processedImage;
      
      if (file.buffer) {
        // From memory storage
        processedImage = await sharp(file.buffer)
          .resize(400, 400, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();
      } else {
        // From disk storage
        processedImage = await sharp(file.path)
          .resize(400, 400, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      // Save processed image
      await fs.writeFile(filepath, processedImage);

      // Generate different sizes
      const sizes = {
        thumbnail: { width: 100, height: 100 },
        medium: { width: 200, height: 200 },
        large: { width: 400, height: 400 }
      };

      const processedFiles = {};

      for (const [size, dimensions] of Object.entries(sizes)) {
        const sizeFilename = `user_${userId}_${timestamp}_${size}${extension}`;
        const sizeFilepath = path.join(this.uploadDir, sizeFilename);

        const resizedImage = await sharp(file.buffer || file.path)
          .resize(dimensions.width, dimensions.height, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        await fs.writeFile(sizeFilepath, resizedImage);
        processedFiles[size] = sizeFilename;
      }

      return {
        success: true,
        filename: filename,
        filepath: filepath,
        url: `/uploads/profiles/${filename}`,
        sizes: processedFiles,
        message: 'Image uploaded and processed successfully'
      };

    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  // Delete image file
  async deleteImage(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);
      
      // Also delete different sizes if they exist
      const baseName = path.parse(filename).name;
      const extension = path.parse(filename).ext;
      
      const sizes = ['thumbnail', 'medium', 'large'];
      for (const size of sizes) {
        const sizeFilename = `${baseName}_${size}${extension}`;
        const sizeFilepath = path.join(this.uploadDir, sizeFilename);
        try {
          await fs.unlink(sizeFilepath);
        } catch (err) {
          // Size file might not exist, ignore error
        }
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Get image info
  async getImageInfo(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      const stats = await fs.stat(filepath);
      
      return {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/profiles/${filename}`
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error('Failed to get image info');
    }
  }

  // Validate file
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Invalid file extension.');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Get storage statistics
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.uploadDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filepath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
      }

      return {
        totalFiles: files.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        uploadDir: this.uploadDir
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { error: 'Failed to get storage stats' };
    }
  }
}

module.exports = FileUploadService;
