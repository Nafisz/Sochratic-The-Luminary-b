// services/expService.js
const axios = require('axios');

const ELEMENTS = [
  'Clarity',
  'Accuracy',
  'Precision',
  'Relevance',
  'Depth',
  'Breadth',
  'Logic',
  'Significance',
  'Fairness'
];

/**
 * Gunakan AI untuk menilai satu sesi penuh
 * @param {string} fullText  seluruh percakapan (system + user + assistant)
 * @returns {Promise<Array<{element:string,value:number}>>}
 */
async function assessSession(fullText) {
  const prompt = `
Anda adalah penilai kualitas diskusi.
Berdasarkan teks berikut, berikan skor 0-100 untuk SETIAP elemen berikut:
- Clarity
- Accuracy
- Precision
- Relevance
- Depth
- Breadth
- Logic
- Significance
- Fairness

Output HANYA dalam bentuk JSON murni:
[
  { "element": "Clarity",   "value": 75 },
  { "element": "Accuracy",  "value": 60 },
  ...
]
Teks diskusi:
"""${fullText}"""
  `.trim();

  const res = await axios.post(
    'https://api.cometapi.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo-1106',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );

  return JSON.parse(res.data.choices[0].message.content);
}

module.exports = { assessSession };