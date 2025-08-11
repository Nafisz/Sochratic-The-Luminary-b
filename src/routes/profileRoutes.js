const express = require('express');
const { authenticateToken } = require('../middleware/jwtMiddleware');

module.exports = (prisma) => {
  const router = express.Router();
  
  console.log('�� === PROFILE ROUTES INITIALIZATION ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('�� Prisma instance:', !!prisma);
  
  // Import ProfileService dengan prisma instance
  const ProfileService = require('../services/profileService');
  const profileService = new ProfileService(prisma);
  console.log('✅ ProfileService instantiated successfully');

  /**
   * @route   GET /api/profile
   * @desc    Get user profile
   * @access  Private (JWT required)
   */
  router.get('/', authenticateToken, async (req, res) => {
    console.log('🔐 === PROFILE ROUTE HANDLER EXECUTED ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 User from middleware:', req.user);
    console.log('🆔 User ID:', req.user?.id);
    console.log('�� Request headers:', req.headers);
    
    try {
      const userId = req.user.id;
      console.log('🎯 Fetching profile for user ID:', userId);
      
      console.log('⏳ Calling profileService.getUserProfile...');
      const profile = await profileService.getUserProfile(userId);
      console.log('✅ Profile data retrieved successfully:', profile);
      
      const response = {
        success: true,
        data: profile
      };
      console.log('📤 Sending response:', response);
      
      res.json(response);
      console.log('✅ Response sent successfully');
      
    } catch (error) {
      console.error('❌ === PROFILE ERROR IN ROUTE HANDLER ===');
      console.error('🚨 Error type:', error.constructor.name);
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Error stack:', error.stack);
      console.error('🚨 Full error object:', error);
      
      const errorResponse = {
        success: false,
        message: error.message
      };
      console.log('📤 Sending error response:', errorResponse);
      
      res.status(400).json(errorResponse);
      console.log('✅ Error response sent');
    }
  });

  /**
   * @route   PUT /api/profile
   * @desc    Update user profile
   * @access  Private (JWT required)
   */
  router.put('/', authenticateToken, async (req, res) => {
    console.log('✏️ === PROFILE UPDATE ROUTE HANDLER EXECUTED ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 User from middleware:', req.user);
    console.log('🆔 User ID:', req.user?.id);
    console.log('�� Update data:', req.body);
    
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      console.log('⏳ Calling profileService.updateUserProfile...');
      const updatedProfile = await profileService.updateUserProfile(userId, updateData);
      console.log('✅ Profile updated successfully:', updatedProfile);
      
      const response = {
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      };
      console.log('📤 Sending response:', response);
      
      res.json(response);
      console.log('✅ Update response sent successfully');
      
    } catch (error) {
      console.error('❌ === PROFILE UPDATE ERROR IN ROUTE HANDLER ===');
      console.error('🚨 Error type:', error.constructor.name);
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Error stack:', error.stack);
      
      const errorResponse = {
        success: false,
        message: error.message
      };
      console.log('📤 Sending error response:', errorResponse);
      
      res.status(400).json(errorResponse);
      console.log('✅ Error response sent');
    }
  });

  /**
   * @route   GET /api/profile/stats
   * @desc    Get user statistics
   * @access  Private (JWT required)
   */
  router.get('/stats', authenticateToken, async (req, res) => {
    console.log('📊 === PROFILE STATS ROUTE HANDLER EXECUTED ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 User from middleware:', req.user);
    console.log('🆔 User ID:', req.user?.id);
    
    try {
      const userId = req.user.id;
      console.log('⏳ Calling profileService.getUserStats...');
      
      const stats = await profileService.getUserStats(userId);
      console.log('✅ Stats retrieved successfully:', stats);
      
      const response = {
        success: true,
        data: stats
      };
      console.log('📤 Sending response:', response);
      
      res.json(response);
      console.log('✅ Stats response sent successfully');
      
    } catch (error) {
      console.error('❌ === PROFILE STATS ERROR IN ROUTE HANDLER ===');
      console.error('🚨 Error type:', error.constructor.name);
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Error stack:', error.stack);
      
      const errorResponse = {
        success: false,
        message: error.message
      };
      console.log('📤 Sending error response:', errorResponse);
      
      res.status(400).json(errorResponse);
      console.log('✅ Error response sent');
    }
  });

  /**
   * @route   GET /api/profile/test
   * @desc    Test endpoint without middleware
   * @access  Public
   */
  router.get('/test', (req, res) => {
    console.log('�� === PROFILE TEST ROUTE HANDLER EXECUTED ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('�� Request headers:', req.headers);
    console.log('🌐 Origin:', req.headers.origin);
    
    res.json({ 
      message: 'Profile route works!',
      timestamp: new Date().toISOString(),
      headers: req.headers
    });
    console.log('✅ Test response sent');
  });

  console.log('✅ All profile routes registered successfully');
  return router;
};