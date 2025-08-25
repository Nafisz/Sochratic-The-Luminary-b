// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const ProfileService = require('../services/profileService');
const FileUploadService = require('../services/fileUploadService');
const { authenticateToken } = require('../middleware/jwtMiddleware');

const profileService = new ProfileService();
const fileUploadService = new FileUploadService();

// Apply JWT middleware to all profile routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await profileService.getProfile(userId);
    
    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
});

// Update user profile (bio and profile photo)
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, profilePhoto } = req.body;
    
    // Validate input
    if (bio !== undefined && typeof bio !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Bio must be a string',
      });
    }
    
    if (profilePhoto !== undefined && typeof profilePhoto !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Profile photo must be a string (URL)',
      });
    }
    
    const result = await profileService.updateProfile(userId, { bio, profilePhoto });
    
    res.json(result);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
});

// Upload profile photo
router.post('/upload-photo', fileUploadService.getMemoryStorage().single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const userId = req.user.id;
    
    // Validate file
    const validation = fileUploadService.validateFile(req.file);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors,
      });
    }

    // Process and save image
    const uploadResult = await fileUploadService.processAndSaveImage(req.file, userId);
    
    // Update user profile with new photo URL
    const updateResult = await profileService.updateProfile(userId, { 
      profilePhoto: uploadResult.url 
    });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        upload: uploadResult,
        profile: updateResult.data
      }
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile photo',
    });
  }
});

// Delete profile photo
router.delete('/delete-photo', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current profile to find photo filename
    const profile = await profileService.getProfile(userId);
    
    if (!profile.data.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'No profile photo to delete',
      });
    }

    // Extract filename from URL
    const photoUrl = profile.data.profilePhoto;
    const filename = photoUrl.split('/').pop();
    
    // Delete file from storage
    await fileUploadService.deleteImage(filename);
    
    // Update profile to remove photo URL
    const updateResult = await profileService.updateProfile(userId, { 
      profilePhoto: null 
    });

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
      data: updateResult.data
    });

  } catch (error) {
    console.error('Error deleting profile photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete profile photo',
    });
  }
});

// Get storage statistics
router.get('/storage-stats', async (req, res) => {
  try {
    const stats = await fileUploadService.getStorageStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get storage stats',
    });
  }
});

// Set user online status
router.post('/status/online', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await profileService.setOnlineStatus(userId, true);
    
    res.json(result);
  } catch (error) {
    console.error('Error setting online status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set online status',
    });
  }
});

// Set user offline status
router.post('/status/offline', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await profileService.setOnlineStatus(userId, false);
    
    res.json(result);
  } catch (error) {
    console.error('Error setting offline status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set offline status',
    });
  }
});

// Get user status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await profileService.getUserStatus(userId);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user status',
    });
  }
});

// Heartbeat to keep user online
router.post('/heartbeat', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await profileService.heartbeat(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process heartbeat',
    });
  }
});

// Get all online users (public endpoint)
router.get('/online-users', async (req, res) => {
  try {
    const onlineUsers = await profileService.getOnlineUsers();
    
    res.json({
      success: true,
      data: onlineUsers,
      count: onlineUsers.length,
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get online users',
    });
  }
});

// Get user profile by username (public endpoint)
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // This would require adding a method to ProfileService
    // For now, we'll return a placeholder
    res.json({
      success: false,
      message: 'Endpoint not implemented yet',
    });
  } catch (error) {
    console.error('Error getting user by username:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user profile',
    });
  }
});

module.exports = router;
