const express = require('express');
const bcrypt = require('bcrypt'); // Untuk hash password

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { action, email, username, password, name, age } = req.body;

    if (!action || !['login', 'register'].includes(action)) {
      return res.status(400).json({ error: 'Aksi harus login atau register' });
    }

    try {
      if (action === 'register') {
        // Validasi data yang diperlukan saat daftar
        if (!email || !username || !password || !name || age === undefined) {
          return res.status(400).json({ error: 'Semua data diperlukan untuk registrasi' });
        }

        // Cek apakah email atau username sudah dipakai
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
            age: parseInt(age)
          }
        });

        return res.status(201).json({ message: 'Berhasil mendaftar', user: newUser });
      }

      if (action === 'login') {
        if ((!email && !username) || !password) {
          return res.status(400).json({ error: 'Email atau username dan password diperlukan untuk login' });
        }

        const user = await prisma.user.findFirst({
          where: email
            ? { email }
            : { username }
        });

        if (!user) {
          return res.status(401).json({ error: 'User tidak ditemukan' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Password salah' });
        }

        return res.json({ message: 'Login berhasil', user });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
  });

  return router;
};
