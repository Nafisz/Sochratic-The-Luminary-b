const axios = require('axios');
require('dotenv').config();

async function storeEmbedding(vector, metadata) {
  try {
    const res = await axios.post(`${process.env.QDRANT_URL || 'http://localhost:6333'}/collections/novax/points`, {
      points: [
        {
          id: metadata.id || Date.now(),
          vector: vector,
          payload: metadata
        }
      ]
    });
    return res.data;
  } catch (err) {
    console.error('Gagal simpan embedding:', err.message);
    throw err;
  }
}

module.exports = { storeEmbedding };