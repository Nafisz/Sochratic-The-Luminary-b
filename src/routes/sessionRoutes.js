const express = require('express');

module.exports = (prisma, redisClient) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { userId, topic, conversationLog } = req.body;
    try {
      await redisClient.set(`session:${userId}:${Date.now()}`, JSON.stringify(conversationLog));
      const session = await prisma.session.create({ data: { userId, topic } });
      res.json({ session });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan session.' });
    }
  });
  router.get('/:id/points', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: { expPoints: true }
    });
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan.' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail sesi.' });
  }
  });

  return router;
};