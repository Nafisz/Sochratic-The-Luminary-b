// chatService.js  — versi yang menyimpan pertanyaan sistem ke Redis sekali di awal sesi

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

  // 0️⃣  Ambil data topik, problem, Active Recall (hanya sekali di awal)
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { problems: true }
  });
  if (!topic) throw new Error('Topik tidak ditemukan');

  const firstQuestion = topic.problems[0]?.firstQuestion ?? 'Pertanyaan awal belum tersedia';

  const recall = await prisma.activeRecall.findFirst();
  const recallContent = recall
    ? `Active Recall:\n- ${recall.test1}\n- ${recall.test2}\n- ${recall.test3}\n- ${recall.test4}`
    : 'Belum ada data active recall.';

  const systemMsg = `${recallContent}\n\nPertanyaan Awal: ${firstQuestion}`;

  // 1️⃣  Cek apakah ini pesan pertama di sesi
  const historyRaw = await getChatHistory(sessionId);
  const isFirstMessage = historyRaw.length === 0;

  // 2️⃣  Jika pesan pertama, simpan konteks sistem ke Redis
  if (isFirstMessage) {
    await appendChatMessage(sessionId, 'system', systemMsg);
  }

  // 3️⃣  Simpan pesan user
  await appendChatMessage(sessionId, 'user', message);

  // 4️⃣  Ambil history terbaru (sudah termasuk system)
  const chatHistory = (await getChatHistory(sessionId))
    .filter(m => m.role !== 'system')   // biarkan promptManager menangani konteks system
    .map(m => `${m.role}: ${m.content}`);

  // 5️⃣  Bangun prompt otomatis lewat promptManager
  const promptText = buildPrompt(message, {
    mode: 'DEFAULT',                       // bisa diganti sesuai kebutuhan
    topic: topic.title,
    problem: topic.problems[0]?.text ?? '',
    chatHistory
  });

  // 6️⃣  Susun messages untuk OpenAI
  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: promptText }
  ];

  // 7️⃣  Kirim ke OpenAI
  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages,
    temperature: 0.7
  });

  const reply = completion.data.choices[0].message.content;

  // 8️⃣  Simpan balasan AI
  await appendChatMessage(sessionId, 'assistant', reply);

  // 9️⃣  Return (bersihkan tag)
  return reply.replace(/<.*?>/g, '');
}

module.exports = { handleUserMessage };