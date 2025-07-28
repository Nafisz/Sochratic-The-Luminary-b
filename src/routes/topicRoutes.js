// routes/topicRoutes.js
const express = require('express');
const topicService = require('../services/topicService');

module.exports = () => {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      const topics = await topicService.getAllTopics();
      res.json(topics);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal memuat topik.' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const topic = await topicService.getTopicById(req.params.id);
      if (!topic) return res.status(404).json({ error: 'Topik tidak ditemukan.' });
      res.json(topic);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal memuat detail topik.' });
    }
  });

  return router;
};