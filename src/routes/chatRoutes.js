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