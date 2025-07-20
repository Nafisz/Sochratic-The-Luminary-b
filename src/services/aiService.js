function analyzeAIResponse(aiText) {
  const result = {
    isExplanation: false,
    explanationType: null,
    isFinalSolution: false,
    isRealization: false,
    expReward: 0,
  };

  // Cek apakah AI sedang menjelaskan materi
  const explanationMatch = aiText.match(/<MATERI_JENIS=(.*?)>/);
  if (explanationMatch) {
    result.isExplanation = true;
    result.explanationType = explanationMatch[1]; // e.g., DEFINISI, CONTOH_KASUS
  }

  // Cek apakah sudah solusi akhir
  if (aiText.includes('<SOLUSI_AKHIR=YA>')) {
    result.isFinalSolution = true;
  }

  // Cek apakah realisasi solusi sudah dimulai
  if (aiText.includes('<REALISASI_MULAI>')) {
    result.isRealization = true;
  }

  // EXP dari AI
  const expMatch = aiText.match(/<EXP_TAMBAH=(\d+)>/);
  if (expMatch) {
    result.expReward = parseInt(expMatch[1]);
  }

  return result;
}

module.exports = {
  analyzeAIResponse
};

const axios = require('axios');
require('dotenv').config();

async function aiService(conversation) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Konversi percakapan menjadi point berdasarkan element of thought. Format hasil dalam JSON array: [{ element: "reasoning", value: 3 }, ...]' },
        { role: 'user', content: conversation }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );
  return JSON.parse(response.data.choices[0].message.content);
}

module.exports = aiService;
// aiService.js

const axios = require('axios');
const { buildPrompt } = require('./promptManager');

async function getAIResponse(userMessage, context = {}) {
  const prompt = buildPrompt(userMessage, context);

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Kamu adalah mentor AI dalam sistem pembelajaran berbasis proyek dan diskusi.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );

  return response.data.choices[0].message.content;
}

function analyzeAIResponse(aiText) {
  const result = {
    isExplanation: false,
    explanationType: null,
    isFinalSolution: false,
    isRealization: false,
    expReward: 0
  };

  const explanationMatch = aiText.match(/<MATERI_JENIS=(.*?)>/);
  if (explanationMatch) {
    result.isExplanation = true;
    result.explanationType = explanationMatch[1];
  }

  if (aiText.includes('<SOLUSI_AKHIR=YA>')) {
    result.isFinalSolution = true;
  }

  if (aiText.includes('<REALISASI_MULAI>')) {
    result.isRealization = true;
  }

  const expMatch = aiText.match(/<EXP_TAMBAH=(\d+)>/);
  if (expMatch) {
    result.expReward = parseInt(expMatch[1]);
  }

  return result;
}

module.exports = {
  getAIResponse,
  analyzeAIResponse
};

const prompt = generatePrompt({
  topic,
  problem,
  firstQuestion,
  chatHistory
});

const aiOutput = await aiService(prompt);

