const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { name, age } = req.body;
    try {
      const user = await prisma.user.create({ data: { name, age } });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Gagal menyimpan user.' });
    }
  });

  return router;
};

