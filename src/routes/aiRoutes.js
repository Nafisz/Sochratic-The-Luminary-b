// routes/aiRoutes.js
// DEPRECATED: This route is no longer used as we now analyze entire sessions
// instead of individual messages. Use /api/session/:id/analyze instead.

const express = require('express');
// const { analyzeAIResponse } = require('../services/aiService');
// const { storeEmbedding } = require('../services/embeddingService');
// const axios = require('axios');

module.exports = (prisma) => {
  const router = express.Router();

  // This route is deprecated - use session analysis instead
  router.post('/', async (req, res) => {
    res.status(410).json({ 
      error: 'This endpoint is deprecated. Use /api/session/:id/analyze for session-based analysis.',
      message: 'Please analyze entire sessions instead of individual messages for better context and accuracy.'
    });
  });

  return router;
};

// DEPRECATED: Individual message analysis functions
// async function getEmbedding(text) {
//   const response = await axios.post(
//     'https://api.openai.com/v1/embeddings',
//     { input: text, model: 'text-embedding-3-small' },
//     { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
//   );
//   return response.data.data[0].embedding;
// }