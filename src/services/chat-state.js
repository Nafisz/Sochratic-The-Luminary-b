const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Simpan percakapan ke Redis (satu sesi)
async function appendChatMessage(sessionId, role, content) {
  const message = { role, content };
  await redis.rpush(`chat:${sessionId}`, JSON.stringify(message));
}

// Ambil seluruh percakapan dalam satu sesi
async function getChatHistory(sessionId) {
  const data = await redis.lrange(`chat:${sessionId}`, 0, -1);
  return data.map(item => JSON.parse(item));
}

// Hapus sesi percakapan (opsional, misal saat selesai belajar)
async function clearChatSession(sessionId) {
  await redis.del(`chat:${sessionId}`);
}

module.exports = {
  appendChatMessage,
  getChatHistory,
  clearChatSession
};
