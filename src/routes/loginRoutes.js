const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama diperlukan' });
    try {
      let user = await prisma.user.findFirst({ where: { name } });
      if (!user) {
        user = await prisma.user.create({ data: { name, age: 0 } });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Gagal login atau membuat user.' });
    }
  });

  return router;
};