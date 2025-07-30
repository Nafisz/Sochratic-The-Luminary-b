// routes/sessionRoutes.js
const express = require('express');
const { analyzeAndProcessSession, getSessionSummary } = require('../services/sessionAnalysisService');

module.exports = (prisma, redisClient) => {
  const router = express.Router();

  /**
   * POST /api/session
   * Create new session and store in Redis
   */
  router.post('/', async (req, res) => {
    const { userId, topic, conversationLog = [] } = req.body;
    try {
      // 1️⃣ Save to DB
      const session = await prisma.session.create({
        data: { userId: Number(userId), topic }
      });

      // 2️⃣ Save to Redis with session.id key
      await redisClient.set(
        `session:${session.id}`,
        JSON.stringify(conversationLog)
      );

      res.json({ session });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save session.' });
    }
  });

  /**
   * GET /api/session/:id/summary
   * Get session summary from Redis (without processing)
   */
  router.get('/:id/summary', async (req, res) => {
    const { id } = req.params;
    try {
      const summary = await getSessionSummary(parseInt(id));
      if (!summary) {
        return res.status(404).json({ error: 'Session not found or empty.' });
      }
      res.json(summary);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get session summary.' });
    }
  });

  /**
   * POST /api/session/:id/analyze
   * Complete session analysis workflow:
   * - Read from Redis
   * - Analyze with AI
   * - Convert to EXP
   * - Embed to Qdrant
   * - Clean up Redis
   */
  router.post('/:id/analyze', async (req, res) => {
    const { id } = req.params;
    const { userId, topicId } = req.body;
    
    try {
      // Validate required parameters
      if (!userId || !topicId) {
        return res.status(400).json({ 
          error: 'userId and topicId are required for session analysis' 
        });
      }

      // Perform complete session analysis
      const analysisResult = await analyzeAndProcessSession(
        parseInt(id), 
        Number(userId), 
        Number(topicId)
      );

      // Save EXP points to database
      await prisma.expPoint.createMany({
        data: analysisResult.expPoints.map(point => ({
          ...point,
          sessionId: parseInt(id)
        }))
      });

      // Calculate user's total EXP and level
      const userSessions = await prisma.session.findMany({
        where: { userId: Number(userId) },
        include: { expPoints: true }
      });

      const totalExp = userSessions.reduce((sum, session) =>
        sum + session.expPoints.reduce((s2, point) => s2 + point.value, 0), 0
      );

      const level = expToLevel(totalExp);

      res.json({
        ...analysisResult,
        totalExp,
        level,
        message: 'Session analyzed and processed successfully'
      });

    } catch (err) {
      console.error('Session analysis error:', err);
      res.status(500).json({ 
        error: 'Failed to analyze session: ' + err.message 
      });
    }
  });

  /**
   * GET /api/session/:id/points
   * Get session with EXP points (from database)
   */
  router.get('/:id/points', async (req, res) => {
    const { id } = req.params;
    try {
      const session = await prisma.session.findUnique({
        where: { id: parseInt(id) },
        include: { expPoints: true }
      });
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      res.json(session);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get session details.' });
    }
  });

  return router;
};