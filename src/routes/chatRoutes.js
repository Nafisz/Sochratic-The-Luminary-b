const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { topicId, message, userId } = req.body;
    if (!topicId || !message) {
      return res.status(400).json({ error: 'topicId and message required' });
    }

    const reply = await chatService.handleUserMessage({ topicId, message, userId });
    res.json({ reply });
  } catch (err) {
    console.error('[Chat Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// Pseudocode di express:
router.post('/chat', async (req, res) => {
  const { sessionId, userMessage } = req.body;

  // Simpan userMessage ke Redis dan PostgreSQL
  await redis.rpush(`chat:${sessionId}`, `USER: ${userMessage}`);
  await db.chat.create({ sessionId, sender: 'user', text: userMessage });

  // Ambil context
  const session = await db.session.findUnique({ where: { id: sessionId } });
  const chatHistory = await redis.lrange(`chat:${sessionId}`, -10, -1);

  // Tentukan stage diskusi
  const stage = session.stage || 'discussion';

  // Generate prompt
  const prompt = promptGenerator({
    behavior: session.behavior,
    topic: session.topicName,
    problem: session.problemTitle,
    history: chatHistory,
    stage,
    userMessage
  });

  // Kirim ke AI
  const aiText = await aiService.callAI(prompt);

  // Analisis tag
  const analysis = analyzeAIResponse(aiText);

  // Simpan AI response
  await redis.rpush(`chat:${sessionId}`, `AI: ${aiText}`);

  // Update session jika perlu
  if (analysis.isFinalSolution) {
    await db.session.update({ where:{id:sessionId}, data:{stage:'realization'} });
  }

  // Response ke frontend
  res.json({ text: aiText.replace(/<.*?>/g,''), ...analysis });
});
