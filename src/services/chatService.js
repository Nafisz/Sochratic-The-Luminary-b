// chatService.js
const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getChatHistory, appendChatMessage } = require('./chat-state');
const { buildPrompt } = require('./promptManager');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.COMET_API_KEY,
  baseURL: process.env.COMET_API_BASE_URL || 'https://api.openai.com/v1',
});

async function handleUserMessage({ topicId, message, userId, sessionId }) {
  if (!sessionId) throw new Error('sessionId must be provided');

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { problems: true }
  });
  if (!topic) throw new Error('Topic not found');

  const firstQuestion = topic.problems[0]?.firstQuestion ?? 'Initial question not available';

  const recall = await prisma.activeRecall.findFirst();
  const recallContent = recall
    ? `Active Recall:\n- ${recall.test1}\n- ${recall.test2}\n- ${recall.test3}\n- ${recall.test4}`
    : 'No active recall data available.';

  const systemMsg = `${recallContent}\n\nInitial Question: ${firstQuestion}`;

  const historyRaw = await getChatHistory(sessionId);
  const isFirstMessage = historyRaw.length === 0;

  if (isFirstMessage) {
    await appendChatMessage(sessionId, 'system', systemMsg);
  }

  await appendChatMessage(sessionId, 'user', message);

  const chatHistory = (await getChatHistory(sessionId))
    .filter(m => m.role !== 'system')
    .map(m => `${m.role}: ${m.content}`);

  const promptText = buildPrompt(message, {
    mode: 'DEFAULT',
    topic: topic.title,
    problem: topic.problems[0]?.text ?? '',
    chatHistory
  });

  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: promptText }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 0.7
  });

  const reply = completion.choices[0].message.content;

  await appendChatMessage(sessionId, 'assistant', reply);

  return reply.replace(/<.*?>/g, '');
}

module.exports = { handleUserMessage };
