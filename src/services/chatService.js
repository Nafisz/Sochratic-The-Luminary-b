const { Configuration, OpenAIApi } = require('openai');
const prisma = require('../lib/prisma');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

async function handleUserMessage({ topicId, message, userId }) {
  // 1. Ambil topik dan problems-nya dari database
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { problems: true }
  });

  if (!topic) throw new Error('Topik tidak ditemukan');

  // 2. Ambil pertanyaan awal dari problem pertama
  const firstQuestion = topic.problems[0]?.firstQuestion ?? 'Pertanyaan awal belum tersedia';

  // 3. Ambil konten Active Recall dari model ActiveRecall
  const recall = await prisma.activeRecall.findFirst();

  const recallContent = recall
    ? `
Active Recall:
- ${recall.test1}
- ${recall.test2}
- ${recall.test3}
- ${recall.test4}
`
    : 'Belum ada data active recall.';

  // 4. Susun konteks dari topik
  const context = `
Topik: ${topic.title}
Deskripsi: ${topic.description}
Konten: ${topic.content}
Problem Awal: ${topic.problems[0]?.text ?? 'Belum ada problem'}
`;

  const fullPrompt = `
${context}

User: ${message}
`;

  // 5. Susun struktur messages untuk OpenAI
  const messages = [
    {
      role: 'ai',
      content: 'Kamu adalah AI Aristotic tutor yang memandu murid lewat pertanyaan dan diskusi.'
    },
    {
      role: 'user',
      content: fullPrompt.trim()
    },
    {
      role: 'system',
      content: `${recallContent.trim()}\n\nPertanyaan Awal: ${firstQuestion}`
    }
  ];

  // 6. Kirim ke OpenAI
  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages
  });

  return completion.data.choices[0].message.content;
}

module.exports = { handleUserMessage };
