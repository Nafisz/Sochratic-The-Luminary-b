// services/sessionAnalysisService.js
const { getChatHistory, clearChatSession } = require('./chat-state');
const { assessSession } = require('./expService');
const { storeEmbedding } = require('./embeddingService');
const { expToLevel } = require('./levelService');

/**
 * Complete session analysis workflow:
 * 1. Read full session from Redis
 * 2. Analyze with AI and convert to EXP
 * 3. Embed conversation to Qdrant
 * 4. Clean up Redis cache
 * 5. Return analysis results
 */
async function analyzeAndProcessSession(sessionId, userId, topicId) {
  try {
    // 1️⃣ Get complete session from Redis
    const sessionMessages = await getChatHistory(sessionId);
    
    if (!sessionMessages || sessionMessages.length === 0) {
      throw new Error('No session data found in Redis');
    }

    // 2️⃣ Convert session to full text for AI analysis
    const fullConversationText = sessionMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // 3️⃣ AI analyzes entire session and converts to EXP points
    const expPoints = await assessSession(fullConversationText);
    
    // 4️⃣ Create metadata for embedding
    const sessionMetadata = {
      id: sessionId,
      userId: userId,
      topicId: topicId,
      messageCount: sessionMessages.length,
      timestamp: new Date().toISOString(),
      source: 'session_conversation'
    };

    // 5️⃣ Embed full conversation to Qdrant
    const embedding = await generateEmbedding(fullConversationText);
    await storeEmbedding(embedding, sessionMetadata);

    // 6️⃣ Clean up Redis cache
    await clearChatSession(sessionId);

    // 7️⃣ Return analysis results
    return {
      success: true,
      sessionId: sessionId,
      expPoints: expPoints,
      messageCount: sessionMessages.length,
      totalExp: expPoints.reduce((sum, point) => sum + point.value, 0),
      elements: expPoints.map(point => point.element)
    };

  } catch (error) {
    console.error('Session analysis failed:', error);
    throw error;
  }
}

/**
 * Generate embedding for conversation text
 */
async function generateEmbedding(text) {
  const axios = require('axios');
  
  const response = await axios.post(
    'https://api.openai.com/v1/embeddings',
    { 
      input: text, 
      model: 'text-embedding-3-small' 
    },
    { 
      headers: { 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}` 
      } 
    }
  );
  
  return response.data.data[0].embedding;
}

/**
 * Get session summary without processing
 */
async function getSessionSummary(sessionId) {
  const sessionMessages = await getChatHistory(sessionId);
  
  if (!sessionMessages || sessionMessages.length === 0) {
    return null;
  }

  return {
    sessionId: sessionId,
    messageCount: sessionMessages.length,
    hasData: true,
    preview: sessionMessages.slice(-3).map(msg => `${msg.role}: ${msg.content.substring(0, 100)}...`)
  };
}

module.exports = {
  analyzeAndProcessSession,
  getSessionSummary,
  generateEmbedding
}; 