// chatService.js  — versi final tanpa duplikat system prompt

const { Configuration, OpenAIApi } = require('openai');
const prisma = require('../lib/prisma');
const { getChatHistory, appendChatMessage } = require('./chat-state');
const { buildPrompt } = require('./promptManager');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

async function handleUserMessage({ topicId, message, userId, sessionId }) {
  if (!sessionId) throw new Error('sessionId harus disediakan');

  // 0️⃣  Simpan pesan user ke Redis
  await appendChatMessage(sessionId, 'user', message);

  // 1️⃣  Ambil topik & problem
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { problems: true }
  });
  if (!topic) throw new Error('Topik tidak ditemukan');

  const firstQuestion = topic.problems[0]?.firstQuestion ?? 'Pertanyaan awal belum tersedia';

  // 2️⃣  Ambil Active Recall
  const recall = await prisma.activeRecall.findFirst();
  const recallContent = recall
    ? `Active Recall:\n- ${recall.test1}\n- ${recall.test2}\n- ${recall.test3}\n- ${recall.test4}`
    : 'Belum ada data active recall.';

  // 3️⃣  Ambil history chat
  const historyRaw = await getChatHistory(sessionId);
  const chatHistory = historyRaw.map(m => `${m.role}: ${m.content}`);

  // 4️⃣  Bangun prompt otomatis lewat promptManager
  const promptText = buildPrompt(message, {
    mode: 'DEFAULT',                       // atau 'JELASKAN_KONSEP' / 'MASUK_REALISASI'
    topic: topic.title,
    problem: topic.problems[0]?.text ?? '',
    chatHistory
  });

  // 5️⃣  Susun messages untuk OpenAI (hanya 2 role: system & user)
  const messages = [
    {
      role: 'system',
      content: `${recallContent}\n\nPertanyaan Awal: ${firstQuestion}`
    },
    {
      role: 'user',
      content: promptText
    }
  ];

  // 6️⃣  Kirim ke OpenAI
  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages,
    temperature: 0.7
  });

  const reply = completion.data.choices[0].message.content;

  // 7️⃣  Simpan balasan AI ke Redis
  await appendChatMessage(sessionId, 'asisstant', reply);

  // 8️⃣  Return (bersihkan tag)
  return reply.replace(/<.*?>/g, '');
}

module.exports = { handleUserMessage };