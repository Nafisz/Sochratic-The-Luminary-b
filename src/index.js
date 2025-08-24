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
const paymentRoutes = require('./routes/paymentRoutes');

// ── Import route-factories -----------------------------------------
const authRoutes    = require('./routes/authRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const expRoutes     = require('./routes/expRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const topicRoutes   = require('./routes/topicRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const ProfileService = require('./services/profileService');

// ── Instance setup ------------------------------------------------
const app    = express();
const prisma = new PrismaClient();
const redis  = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// ── Middleware ----------------------------------------------------
// Konfigurasi CORS untuk mengizinkan frontend dari folder berbeda
const corsOptions = {
  origin: [
    'http://localhost:3000',     // React default
    'http://localhost:3001',     // React alternative
    'http://localhost:5173',     // Vite default
    'http://localhost:8080',     // Vue CLI default
    'http://localhost:4200',     // Angular default
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:4200',
    // Tambahkan domain frontend Anda di sini
    process.env.FRONTEND_URL // Jika menggunakan environment variable
  ].filter(Boolean), // Filter out undefined values
  credentials: true, // Mengizinkan cookies dan headers authorization
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files (profile photos)
app.use('/uploads', express.static('uploads'));

// Middleware untuk logging request (berguna untuk debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'Unknown'}`);
  next();
});

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

// Stripe requires the raw body for webhook signature verification.
// Mount webhook BEFORE json body parser.
const payment = paymentRoutes(prisma);
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), payment.webhookHandler);

// JSON parser for the rest of the routes
app.use(express.json());

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
app.use('/api/protected', protectedRoutes(prisma));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/payment', payment.router);

// ── Boot ----------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server ready on http://localhost:${PORT}`));