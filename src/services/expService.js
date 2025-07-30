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
 * Use AI to assess a full session
 * @param {string} fullText  entire conversation (system + user + assistant)
 * @returns {Promise<Array<{element:string,value:number}>>}
 */
async function assessSession(fullText) {
  const prompt = `
You are an expert educational assessment AI. Your task is to carefully analyze the following learning conversation and provide accurate, calculated scores for the student's performance across multiple cognitive dimensions.

IMPORTANT: You must calculate each score based on your detailed analysis of the conversation. Do not use predetermined values. Each score should reflect your genuine assessment of the student's performance in that specific dimension.

Based on the ENTIRE conversation below, calculate and provide a score of 0-100 for EACH of the following elements:

**Assessment Criteria:**
- **Clarity**: How clearly did the student express their thoughts and understanding?
- **Accuracy**: How accurate were the student's answers and concepts?
- **Precision**: How precise and specific were the student's responses?
- **Relevance**: How relevant were the student's answers to the topic being discussed?
- **Depth**: How deep was the student's understanding and analysis?
- **Breadth**: How comprehensive was the student's knowledge of the topic?
- **Logic**: How logical and well-reasoned were the student's arguments?
- **Significance**: How significant and meaningful were the student's contributions?
- **Fairness**: How balanced and objective was the student's perspective?

**Scoring Guidelines:**
- 0-20: Poor performance, significant misunderstandings or lack of engagement
- 21-40: Below average, some understanding but major gaps
- 41-60: Average performance, basic understanding with room for improvement
- 61-80: Good performance, solid understanding with some depth
- 81-100: Excellent performance, deep understanding and sophisticated thinking

**Consider the entire conversation context, including:**
- Initial questions and responses
- Problem-solving approach
- Conceptual understanding
- Critical thinking demonstrated
- Learning progression throughout the session
- Quality of questions asked
- Depth of explanations provided
- Ability to connect concepts
- Evidence of reflection and self-correction

Conversation to analyze:
"""${fullText}"""

After your analysis, output ONLY a pure JSON array with your calculated scores. Replace the placeholder numbers with your actual calculated values:

[
  { "element": "Clarity",   "value": 0 },
  { "element": "Accuracy",  "value": 0 },
  { "element": "Precision", "value": 0 },
  { "element": "Relevance", "value": 0 },
  { "element": "Depth",     "value": 0 },
  { "element": "Breadth",   "value": 0 },
  { "element": "Logic",     "value": 0 },
  { "element": "Significance", "value": 0 },
  { "element": "Fairness",  "value": 0 }
]

Replace each "0" with your calculated score (0-100) based on your analysis.
  `.trim();

  const res = await axios.post(
    'https://api.cometapi.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );

  return JSON.parse(res.data.choices[0].message.content);
}

module.exports = { assessSession };