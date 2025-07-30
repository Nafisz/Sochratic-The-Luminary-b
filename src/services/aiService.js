// aiService.js
const axios = require('axios');
const { buildPrompt } = require('./promptManager');
require('dotenv').config();

function analyzeAIResponse(aiText) {
  const result = {
    isExplanation: false,
    explanationType: null,
    isFinalSolution: false,
    isRealization: false,
    expReward: 0,
  };

  // Check if AI is explaining concept
  const explanationMatch = aiText.match(/<CONCEPT_TYPE=(.*?)>/);
  if (explanationMatch) {
    result.isExplanation = true;
    result.explanationType = explanationMatch[1];
  }

  // Check if final solution is reached
  if (aiText.includes('<FINAL_SOLUTION=YES>')) {
    result.isFinalSolution = true;
  }

  // Check if solution realization has started
  if (aiText.includes('<IMPLEMENTATION_START>')) {
    result.isRealization = true;
  }

  // EXP from AI
  const expMatch = aiText.match(/<EXP_ADD=(\d+)>/);
  if (expMatch) {
    result.expReward = parseInt(expMatch[1]);
  }

  return result;
}

async function aiService(conversation) {
  const response = await axios.post(
    'https://api.cometapi.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Convert conversation to points based on element of thought. Output format in JSON array: [{ element: "reasoning", value: 3 }, ...]' },
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

async function getAIResponse(userMessage, context = {}) {
  const prompt = buildPrompt(userMessage, context);

  const response = await axios.post(
    'https://api.cometapi.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI mentor in a project and discussion-based learning system.' },
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

module.exports = {
  analyzeAIResponse,
  aiService,
  getAIResponse
};

