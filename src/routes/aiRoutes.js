// routes/aiRoutes.js
const express = require('express');
const { analyzeAIResponse } = require('../services/aiService');
const { storeEmbedding } = require('../services/embeddingService');
const axios = require('axios');

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { conversation, sessionId, userId } = req.body;

    try {
      const aiOutput = await aiService(conversation);
      if (!Array.isArray(aiOutput)) return res.status(400).json({ error: 'Format AI tidak valid' });

      const enrichedOutput = aiOutput.map(entry => {
        const tags = analyzeAIResponse(entry.text);
        return { ...entry, ...tags };
      });

      const expData = enrichedOutput
        .filter(p => p.expReward > 0)
        .map(p => ({
          value: p.expReward,
          sessionId,
          type: p.explanationType || 'UNKNOWN'
        }));

      if (expData.length > 0) {
        await prisma.expPoint.createMany({ data: expData });
      }

      const vector = await getEmbedding(conversation);
      await storeEmbedding(vector, { sessionId, userId, source: 'conversation' });

      const sanitizedResult = enrichedOutput.map(({ text, ...rest }) => ({
        text: text.replace(/<.*?>/g, ''),
        ...rest
      }));

      res.json({ result: sanitizedResult });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal konversi dan simpan.' });
    }
  });

  return router;
};

async function getEmbedding(text) {
  const response = await axios.post(
    'https://api.cometap.com/v1/embeddings',
    { input: text, model: 'text-embedding-3-small' },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return response.data.data[0].embedding;
}