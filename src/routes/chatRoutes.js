const express = require('express');
const OpenAI = require('openai');
const { getChatHistory, appendChatMessage } = require('../services/chat-state');
const { buildPrompt } = require('../services/promptManager');
require('dotenv').config();

module.exports = (prisma) => {
  const router = express.Router();

  const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }) : null;

  async function handleUserMessage({ topicId, message, userId, sessionId }) {
  if (!sessionId) throw new Error('sessionId harus disediakan');

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { problems: true }
  });
  if (!topic) throw new Error('Topik tidak ditemukan');

  const firstQuestion = topic.problems[0]?.firstQuestion ?? 'Pertanyaan awal belum tersedia';

  const recall = await prisma.activeRecall.findFirst();
  const recallContent = recall
    ? `Active Recall:\n- ${recall.test1}\n- ${recall.test2}\n- ${recall.test3}\n- ${recall.test4}`
    : 'Belum ada data active recall.';

  const systemMsg = `${recallContent}\n\nPertanyaan Awal: ${firstQuestion}`;

  const historyRaw = await getChatHistory(sessionId);
  const isFirstMessage = historyRaw.length === 0;

  if (isFirstMessage) {
    await appendChatMessage(sessionId, 'system', systemMsg);
  }

  await appendChatMessage(sessionId, 'user', message);

  const chatHistory = (await getChatHistory(sessionId))
    .filter(m => m.role !== 'system')
    .map(m => `${m.role}: ${m.content}`);

  const promptText = buildPrompt(message, {
    mode: 'DEFAULT',
    topic: topic.title,
    problem: topic.problems[0]?.text ?? '',
    chatHistory
  });

  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: promptText }
  ];

  if (!openai) {
    throw new Error('OpenAI API key tidak tersedia. Silakan set OPENAI_API_KEY environment variable.');
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 0.7
  });

  const reply = completion.choices[0].message.content;

  await appendChatMessage(sessionId, 'assistant', reply);

  return reply.replace(/<.*?>/g, '');
}

  // POST /api/chat/message
  router.post('/message', async (req, res) => {
    try {
      const { topicId, message, userId, sessionId } = req.body;
      
      if (!topicId || !message || !sessionId) {
        return res.status(400).json({ error: 'topicId, message, dan sessionId diperlukan' });
      }

      const reply = await handleUserMessage({ topicId, message, userId, sessionId });
      res.json({ reply });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error.message || 'Terjadi kesalahan server' });
    }
  });

  return router;
};