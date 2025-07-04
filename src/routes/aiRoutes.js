const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

router.post('/', async (req, res) => {
  const { conversation } = req.body;
  try {
    const aiOutput = await aiService(conversation);
    res.json({ result: aiOutput });
  } catch (err) {
    res.status(500).json({ error: 'Gagal konversi AI.' });
  }
});

module.exports = router;
