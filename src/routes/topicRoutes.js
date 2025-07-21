const express = require('express');
const router = express.Router();
const topicService = require('../services/topicService'); // pastikan ini ada

router.get('/topics', async (req, res) => {
  const topics = await topicService.getAllTopics(); // ambil dari DB
  res.json(topics);
});

router.get('/topics/:id', async (req, res) => {
  const topic = await topicService.getTopicById(req.params.id);
  res.json(topic);
});

module.exports = router;
