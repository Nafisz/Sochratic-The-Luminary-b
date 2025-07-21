// src/index.js  (final, 1-to-1 dengan struktur aktual)
require('dotenv').config();
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
const redis  = createClient({ url: process.env.REDIS_URL });

// ── Middleware ----------------------------------------------------
app.use(cors());
app.use(express.json());

// ── Connect Redis -------------------------------------------------
redis.connect().catch(console.error);

// ── Health check --------------------------------------------------
app.get('/', (_, res) => res.json({ status: 'NovaX Backend Running 🚀' }));

// ── Mount routes --------------------------------------------------
app.use('/api/auth',    authRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/exp',     expRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/topic',   topicRoutes);

// ── Boot ----------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server ready on http://localhost:${PORT}`));