// routes/expRoutes.js  (versi final)
const express = require('express');
const { assessSession } = require('../services/expService');
const { getChatHistory } = require('../services/chat-state');
const { expToLevel, levelToExp } = require('../services/levelService');
const { completeSession, getUserCompletedSessions } = require('../services/sessionManagementService');

module.exports = (prisma) => {
  const router = express.Router();

  /**
   * POST /api/exp/complete/:sessionId
   * Complete session and save to database + Qdrant + give exp
   */
  router.post('/complete/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { userId, topicId } = req.body;
    
    try {
      if (!userId || !topicId) {
        return res.status(400).json({ error: 'userId and topicId are required' });
      }

      // Complete the session (this includes exp assessment, embedding, and database save)
      const result = await completeSession(sessionId, userId, topicId, prisma);

      // Calculate total user EXP (all completed sessions)
      const sessions = await prisma.session.findMany({
        where: { 
          userId: parseInt(userId),
          status: 'COMPLETED'
        },
        include: { expPoints: true }
      });
      
      const totalExp = sessions.reduce((sum, s) =>
        sum + s.expPoints.reduce((s2, p) => s2 + p.value, 0), 0
      );
      const level = expToLevel(totalExp);

      res.json({ 
        ...result, 
        totalExp, 
        level,
        message: 'Session completed successfully!'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to complete session.' });
    }
  });

  /**
   * GET /api/exp/completed-sessions/:userId
   * Get user's completed sessions for frontend display
   */
  router.get('/completed-sessions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const completedSessions = await getUserCompletedSessions(userId, prisma);
      res.json({ 
        success: true, 
        completedSessions,
        count: completedSessions.length
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get completed sessions.' });
    }
  });

  /**
   * POST /api/exp/assess/:sessionId
   * AI assesses entire conversation then saves 8 EXP elements
   * @deprecated Use /api/exp/complete/:sessionId instead
   */
  router.post('/assess/:sessionId', async (req, res) => {
    res.status(410).json({ 
      error: 'This endpoint is deprecated. Use /api/exp/complete/:sessionId for session completion.',
      message: 'Please use the complete endpoint which handles the full session workflow.'
    });
  });

  /**
   * POST /api/exp
   * Manual bulk-insert (for testing / admin)
   */
  router.post('/', async (req, res) => {
    const { sessionId, points } = req.body; // [{ element:'Accuracy', value: 80 }, ...]
    try {
      const created = await prisma.expPoint.createMany({
        data: points.map(p => ({ ...p, sessionId }))
      });
      res.json({ success: true, count: created.count });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save EXP.' });
    }
  });

     /**
    * GET /api/exp/user/:userId
    * Dashboard total per element + level (only completed sessions)
    */
  router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const sessions = await prisma.session.findMany({
        where: { 
          userId: Number(userId),
          status: 'COMPLETED'
        },
        include: { expPoints: true }
      });

      // total per element
      const dashboard = {};
      let totalExp = 0;
      sessions.forEach(session => {
        session.expPoints.forEach(point => {
          dashboard[point.type] = (dashboard[point.type] || 0) + point.value;
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
        nextLevelExp,
        completedSessionsCount: sessions.length
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get dashboard.' });
    }
  });

  return router;
};