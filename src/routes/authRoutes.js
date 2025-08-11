const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../middleware/jwtMiddleware');

module.exports = (prisma) => {
  const router = express.Router();

  // REGISTER
  router.post('/register', async (req, res) => {
    const { email, username, password, name, age } = req.body;

    if (!email || !username || !password || !name || age === undefined) {
      return res.status(400).json({ error: 'All data is required for registration' });
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email or username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          username,
          password: hashedPassword,
          age: parseInt(age),
        },
      });

      // Don't send password to client
      const { password: _, ...safeUser } = newUser;
      
      // Generate JWT token
      const token = generateToken(safeUser);
      
      res.status(201).json({ 
        message: 'Registration successful', 
        user: safeUser,
        token: token
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error during registration' });
    }
  });

  // LOGIN
  router.post('/login', async (req, res) => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email or username and password are required for login' });
    }

    try {
      const user = await prisma.user.findFirst({
        where: email ? { email } : { username }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const { password: _, ...safeUser } = user;
      
      // Generate JWT token
      const token = generateToken(safeUser);
      
      res.json({ 
        message: 'Login successful', 
        user: safeUser,
        token: token
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error during login' });
    }
  });

  // REFRESH TOKEN (optional)
  router.post('/refresh', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get fresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...safeUser } = user;
      const newToken = generateToken(safeUser);
      
      res.json({ 
        message: 'Token refreshed successfully',
        user: safeUser,
        token: newToken
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
  });

  // VERIFY TOKEN (optional)
  router.get('/verify', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get fresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...safeUser } = user;
      
      res.json({ 
        message: 'Token is valid',
        user: safeUser,
        valid: true
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
  });

  return router;
};
