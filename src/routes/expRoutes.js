const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { sessionId, points } = req.body; // points = [{ element: 'reasoning', value: 3 }, ...]
    try {
      const created = await prisma.expPoint.createMany({
        data: points.map(p => ({ ...p, sessionId }))
      });
      res.json({ success: true, count: created.count });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan EXP.' });
    }
  });

  router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const sessions = await prisma.session.findMany({
        where: { userId },
        include: { expPoints: true }
      });
      const dashboard = {};
      sessions.forEach(session => {
        session.expPoints.forEach(point => {
          dashboard[point.element] = (dashboard[point.element] || 0) + point.value;
        });
      });
      res.json({ dashboard });
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil dashboard.' });
    }
  });

  return router;
};