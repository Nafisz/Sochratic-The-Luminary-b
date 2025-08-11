const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/jwtMiddleware');

module.exports = (prisma) => {
  const router = express.Router();

  // Route yang membutuhkan autentikasi penuh
  router.get('/profile', authenticateToken, async (req, res) => {
    try {
      // req.user sudah tersedia dari middleware authenticateToken
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          age: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        message: 'Profile retrieved successfully',
        user: user
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Route yang membutuhkan autentikasi penuh
  router.put('/profile', authenticateToken, async (req, res) => {
    const { name, age } = req.body;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name || undefined,
          age: age !== undefined ? parseInt(age) : undefined
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          age: true,
          createdAt: true
        }
      });

      res.json({ 
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Route dengan autentikasi opsional
  router.get('/public-data', optionalAuth, async (req, res) => {
    try {
      let response = { message: 'Public data retrieved' };
      
      // Jika user terautentikasi, tambahkan data personal
      if (req.user) {
        response.user = {
          id: req.user.id,
          name: req.user.name,
          isAuthenticated: true
        };
      } else {
        response.user = {
          isAuthenticated: false
        };
      }

      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
