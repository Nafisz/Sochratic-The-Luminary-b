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
      res.status(500).json({ error: 'Failed to load topics.' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const topic = await topicService.getTopicById(req.params.id);
      if (!topic) return res.status(404).json({ error: 'Topic not found.' });
      res.json(topic);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to load topic details.' });
    }
  });

  return router;
};