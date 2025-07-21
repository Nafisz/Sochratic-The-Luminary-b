const express = require('express');
const bcrypt = require('bcrypt');

module.exports = (prisma) => {
  const router = express.Router();

  // REGISTER
  router.post('/register', async (req, res) => {
    const { email, username, password, name, age } = req.body;

    if (!email || !username || !password || !name || age === undefined) {
      return res.status(400).json({ error: 'Semua data diperlukan untuk registrasi' });
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }]
        }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email atau username sudah digunakan' });
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

      // Jangan kirim password ke client
      const { password: _, ...safeUser } = newUser;
      res.status(201).json({ message: 'Registrasi berhasil', user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Terjadi kesalahan server saat registrasi' });
    }
  });

  // LOGIN
  router.post('/login', async (req, res) => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email atau username dan password diperlukan untuk login' });
    }

    try {
      const user = await prisma.user.findFirst({
        where: email ? { email } : { username }
      });

      if (!user) {
        return res.status(401).json({ error: 'User tidak ditemukan' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Password salah' });
      }

      const { password: _, ...safeUser } = user;
      res.json({ message: 'Login berhasil', user: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Terjadi kesalahan server saat login' });
    }
  });

  return router;
};
