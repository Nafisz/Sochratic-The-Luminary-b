// routes/sessionRoutes.js
const express = require('express');

module.exports = (prisma, redisClient) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { userId, topic, conversationLog = [] } = req.body;
    try {
      // 1️⃣  Simpan ke DB
      const session = await prisma.session.create({
        data: { userId: Number(userId), topic }
      });

      // 2️⃣  Simpan ke Redis dengan kunci session.id
      await redisClient.set(
        `session:${session.id}`,
        JSON.stringify(conversationLog)
      );

      res.json({ session });
    } catch (err) {
      console.error(err);
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