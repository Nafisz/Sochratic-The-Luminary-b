// routes/profileRoutes.js
const express = require('express');
const { authenticateToken } = require('../middleware/jwtMiddleware');

module.exports = (prisma) => {
  const router = express.Router();

  console.log('🚀 === PROFILE ROUTES INITIALIZED ===', new Date().toISOString());

  // Load service
  const ProfileService = require('../services/profileService');
  const profileService = new ProfileService(prisma);

  /**
   * @route   GET /api/profile
   * @desc    Get user profile
   * @access  Private
   */
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(`🔍 Fetching profile for user ID: ${userId}`);

      // Bisa pilih mau pakai service atau query langsung
      const profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          age: true,
          createdAt: true
        }
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('❌ GET /api/profile error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   PUT /api/profile
   * @desc    Update user profile
   * @access  Private
   */
  router.put('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      console.log(`✏️ Updating profile for user ID: ${userId}`, updateData);

      const updatedProfile = await profileService.updateUserProfile(userId, updateData);
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('❌ PUT /api/profile error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/profile/stats
   * @desc    Get user statistics
   * @access  Private
   */
  router.get('/stats', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(`📊 Getting stats for user ID: ${userId}`);

      const stats = await profileService.getUserStats(userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ GET /api/profile/stats error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/profile/test
   * @desc    Test endpoint
   * @access  Public
   */
  router.get('/test', (req, res) => {
    res.json({
      message: 'Profile route works!',
      timestamp: new Date().toISOString(),
      headers: req.headers
    });
  });

  return router;
};
