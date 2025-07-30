// src/index.js  (final, 1-to-1 dengan struktur aktual)
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not available, using default environment variables');
}
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('redis');

// ── Import route-factories -----------------------------------------
const authRoutes    = require('./routes/authRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const expRoutes     = require('./routes/expRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const topicRoutes   = require('./routes/topicRoutes');

// ── Instance setup ------------------------------------------------
const app    = express();
const prisma = new PrismaClient();
const redis  = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

// ── Middleware ----------------------------------------------------
app.use(cors());
app.use(express.json());

// ── Connect Redis -------------------------------------------------
redis.connect().catch(console.error);

// ── Health check --------------------------------------------------
app.get('/', (_, res) => res.json({ status: 'NovaX Backend Running 🚀' }));

// ── Test Comet API without database -------------------------------
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.COMET_API_KEY,
  baseURL: process.env.COMET_API_BASE_URL || 'https://api.openai.com/v1',
});

app.post('/test-comet', async (req, res) => {
  try {
    const { message = "Hello! Can you tell me a joke?" } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    console.log('CometAPI Response:', JSON.stringify(completion, null, 2));
    
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices returned from CometAPI');
    }

    const reply = completion.choices[0].message.content;
    
    res.json({ 
      success: true,
      message: message,
      reply: reply,
      api: 'Comet API working!'
    });
  } catch (error) {
    console.error('CometAPI Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      api: 'Comet API failed'
    });
  }
});

// ── Mount routes --------------------------------------------------
app.use('/api/auth',    authRoutes(prisma));
app.use('/api/chat',    chatRoutes(prisma));
app.use('/api/exp',     expRoutes(prisma));
app.use('/api/session', sessionRoutes(prisma));
app.use('/api/topic',   topicRoutes(prisma));

// ── Boot ----------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server ready on http://localhost:${PORT}`));