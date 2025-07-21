// index.js  (final)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('redis');  // gunakan ioredis atau redis v4
const userRoutes      = require('./routes/userRoutes');
const sessionRoutes   = require('./routes/sessionRoutes');
const aiRoutes        = require('./routes/aiRoutes');
const expRoutes       = require('./routes/expRoutes');
const loginRoutes     = require('./routes/loginRoutes');

dotenv.config();
const app  = express();
const prisma = new PrismaClient();

// Redis v4
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

app.use(cors());
app.use(express.json());

// Health-check
app.get('/', (req, res) => res.send('NovaX Backend Running'));

// Mount routes
app.use('/user',    userRoutes(prisma, redisClient));
app.use('/session', sessionRoutes(prisma, redisClient));
app.use('/ai',      aiRoutes(prisma, redisClient));      // <-- ganti /convert → /ai
app.use('/exp',     expRoutes(prisma, redisClient));      // <-- tambah redisClient
app.use('/login',   loginRoutes(prisma, redisClient));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NovaX backend jalan di http://localhost:${PORT}`);
});