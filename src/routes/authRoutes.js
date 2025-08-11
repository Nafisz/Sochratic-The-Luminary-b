const express = require('express');
const bcrypt = require('bcryptjs');

// In-memory storage (for development without database)
const users = [];

module.exports = (prisma) => {
  const router = express.Router();

  // REGISTER
  router.post('/register', async (req, res) => {
    const { email, username, password, name, age } = req.body;

    if (!email || !username || !password || !name || age === undefined) {
      return res.status(400).json({ error: 'All data is required for registration' });
    }

    try {
      // Check if user already exists in memory
      const existingUser = users.find(user => 
        user.email === email || user.username === username
      );

      if (existingUser) {
        return res.status(409).json({ error: 'Email or username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        id: users.length + 1,
        name,
        email,
        username,
        password: hashedPassword,
        age: parseInt(age),
        createdAt: new Date()
      };

      users.push(newUser);

      // Don't send password to client
      const { password: _, ...safeUser } = newUser;
      res.status(201).json({ message: 'Registration successful', user: safeUser });
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
      const user = users.find(user => 
        email ? user.email === email : user.username === username
      );

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const { password: _, ...safeUser } = user;
      res.json({ message: 'Login successful', user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error during login' });
    }
  });

  return router;
};
