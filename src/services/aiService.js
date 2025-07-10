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
npx prisma generate
npx prisma migrate dev --name add_topics_and_problems
