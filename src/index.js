const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

app.use(cors());
app.use(express.json());

redisClient.connect().catch(console.error);

app.get('/', (req, res) => {
  res.send('NovaX Backend Running');
});

app.use('/user', userRoutes(prisma));
app.use('/session', sessionRoutes(prisma, redisClient));
app.use('/convert', aiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NovaX backend jalan di http://localhost:${PORT}`);
});


// === File: src/routes/userRoutes.js ===
const express = require('express');

module.exports = (prisma) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { name, age } = req.body;
    try {
      const user = await prisma.user.create({ data: { name, age } });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Gagal menyimpan user.' });
    }
  });

  return router;
};