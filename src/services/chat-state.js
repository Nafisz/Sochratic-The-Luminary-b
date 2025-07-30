const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Save conversation to Redis (one session)
async function appendChatMessage(sessionId, role, content) {
  const message = { role, content };
  await redis.rpush(`chat:${sessionId}`, JSON.stringify(message));
}

// Get all conversation in one session
async function getChatHistory(sessionId) {
  const data = await redis.lrange(`chat:${sessionId}`, 0, -1);
  return data.map(item => JSON.parse(item));
}

// Clear conversation session (optional, e.g. when learning is finished)
async function clearChatSession(sessionId) {
  await redis.del(`chat:${sessionId}`);
}

module.exports = {
  appendChatMessage,
  getChatHistory,
  clearChatSession
};
