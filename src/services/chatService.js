const { Configuration, OpenAIApi } = require('openai');
const prisma = require('../lib/prisma');
require('dotenv').config();

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function handleUserMessage({ topicId, message, userId }) {
  // Fetch topic & problems from DB
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { problems: true }
  });

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Context Prompt
  const context = `
Topik: ${topic.title}
Deskripsi: ${topic.description}
Konten: ${topic.content}
Problem: ${topic.problems[0]?.text ?? 'Belum ada problem'}
  `;

  const fullPrompt = `
${context}

User: ${message}
`; // Bisa diperluas dengan cache percakapan nanti

  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Kamu adalah AI Socratic tutor yang memandu murid lewat pertanyaan dan diskusi.' },
      { role: 'user', content: fullPrompt }
    ]
  });

  return completion.data.choices[0].message.content;
}

module.exports = { handleUserMessage };
