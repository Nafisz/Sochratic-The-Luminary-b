const express = require('express');
const aiService = require('../services/aiService');
const { storeEmbedding } = require('../services/embeddingService');

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { conversation, sessionId, userId } = req.body;
    try {
      const aiOutput = await aiService(conversation);

      if (!Array.isArray(aiOutput)) return res.status(400).json({ error: 'Format AI tidak valid' });

      await prisma.expPoint.createMany({
        data: aiOutput.map(p => ({ ...p, sessionId }))
      });

      const vector = await getEmbedding(conversation); // bisa pakai OpenAI embedding API
      await storeEmbedding(vector, { sessionId, userId, source: 'conversation' });

      res.json({ result: aiOutput });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal konversi dan simpan.' });
    }
  });

  return router;
};

async function getEmbedding(text) {
  const response = await axios.post(
    'https://api.openai.com/v1/embeddings',
    {
      input: text,
      model: 'text-embedding-3-small'
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  return response.data.data[0].embedding;
}
