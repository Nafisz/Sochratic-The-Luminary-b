// routes/expRoutes.js  (versi final)
const express = require('express');
const { assessSession } = require('../services/expService');
const { getChatHistory } = require('../services/chat-state');
const { expToLevel, levelToExp } = require('../services/levelService');

module.exports = (prisma) => {
  const router = express.Router();

  /**
   * POST /api/exp/assess/:sessionId
   * AI menilai seluruh percakapan lalu simpan 8 elemen EXP
   */
  router.post('/assess/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
      // 1️⃣  Ambil semua pesan (termasuk system)
      const historyRaw = await getChatHistory(sessionId);
      const fullText = historyRaw
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      // 2️⃣  Nilai 8 elemen via AI
      const points = await assessSession(fullText);

      // 3️⃣  Simpan ke DB
      await prisma.expPoint.createMany({
        data: points.map(p => ({ ...p, sessionId }))
      });

      // 4️⃣  Hitung total EXP user (semua session)
      const sessions = await prisma.session.findMany({
        where: { userId: (await prisma.session.findUnique({ where: { id: parseInt(sessionId) } }))?.userId },
        include: { expPoints: true }
      });
      const totalExp = sessions.reduce((sum, s) =>
        sum + s.expPoints.reduce((s2, p) => s2 + p.value, 0), 0
      );
      const level = expToLevel(totalExp);

      res.json({ success: true, points, totalExp, level });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal menilai session.' });
    }
  });

  /**
   * POST /api/exp
   * Bulk-insert manual (untuk testing / admin)
   */
  router.post('/', async (req, res) => {
    const { sessionId, points } = req.body; // [{ element:'Accuracy', value: 80 }, ...]
    try {
      const created = await prisma.expPoint.createMany({
        data: points.map(p => ({ ...p, sessionId }))
      });
      res.json({ success: true, count: created.count });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menyimpan EXP.' });
    }
  });

  /**
   * GET /api/exp/user/:userId
   * Dashboard total per elemen + level
   */
  router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const sessions = await prisma.session.findMany({
        where: { userId: Number(userId) },
        include: { expPoints: true }
      });

      // total per elemen
      const dashboard = {};
      let totalExp = 0;
      sessions.forEach(session => {
        session.expPoints.forEach(point => {
          dashboard[point.element] = (dashboard[point.element] || 0) + point.value;
          totalExp += point.value;
        });
      });

      const level = expToLevel(totalExp);
      const nextLevelExp = levelToExp(level + 1);
      const currentExpInLevel = totalExp - levelToExp(level);

      res.json({
        dashboard,
        totalExp,
        level,
        currentExpInLevel,
        nextLevelExp
      });
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil dashboard.' });
    }
  });

  return router;
};