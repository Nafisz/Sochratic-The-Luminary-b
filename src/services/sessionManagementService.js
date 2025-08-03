// services/sessionManagementService.js
const { getChatHistory, clearChatSession } = require('./chat-state');
const { assessSession } = require('./expService');
const { storeEmbedding } = require('./embeddingService');
const { generateEmbedding } = require('./sessionAnalysisService');

/**
 * Complete a session and save to database + Qdrant
 * This function is called when user completes the session and gets exp
 */
async function completeSession(sessionId, userId, topicId, prisma) {
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
      source: 'completed_session_conversation'
    };

    // 5️⃣ Embed full conversation to Qdrant
    const embedding = await generateEmbedding(fullConversationText);
    await storeEmbedding(embedding, sessionMetadata);

    // 6️⃣ Save exp points to database
    await prisma.expPoint.createMany({
      data: expPoints.map(point => ({
        sessionId: parseInt(sessionId),
        type: point.element,
        value: point.value
      }))
    });

    // 7️⃣ Update session status to completed
    await prisma.session.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // 8️⃣ Clean up Redis cache
    await clearChatSession(sessionId);

    // 9️⃣ Return completion results
    return {
      success: true,
      sessionId: sessionId,
      expPoints: expPoints,
      messageCount: sessionMessages.length,
      totalExp: expPoints.reduce((sum, point) => sum + point.value, 0),
      elements: expPoints.map(point => point.element)
    };

  } catch (error) {
    console.error('Session completion failed:', error);
    throw error;
  }
}

/**
 * Abandon a session - delete from Redis AND PostgreSQL
 * This function is called when user leaves without completing
 */
async function abandonSession(sessionId, prisma) {
  try {
    // 1️⃣ Clear from Redis
    await clearChatSession(sessionId);
    
    // 2️⃣ Delete session from PostgreSQL database
    await prisma.session.delete({
      where: { id: parseInt(sessionId) }
    });
    
    return {
      success: true,
      sessionId: sessionId,
      message: 'Session abandoned and completely removed from system'
    };
  } catch (error) {
    console.error('Session abandonment failed:', error);
    throw error;
  }
}

/**
 * Get user's completed sessions for frontend display
 */
async function getUserCompletedSessions(userId, prisma) {
  try {
    const completedSessions = await prisma.session.findMany({
      where: {
        userId: parseInt(userId),
        status: 'COMPLETED'
      },
      include: {
        topic: {
          include: {
            course: true
          }
        },
        expPoints: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    return completedSessions.map(session => ({
      id: session.id,
      topicId: session.topicId,
      topicTitle: session.topic.content,
      courseTitle: session.topic.course.title,
      completedAt: session.completedAt,
      totalExp: session.expPoints.reduce((sum, point) => sum + point.value, 0),
      expBreakdown: session.expPoints.reduce((acc, point) => {
        acc[point.type] = point.value;
        return acc;
      }, {})
    }));
  } catch (error) {
    console.error('Failed to get completed sessions:', error);
    throw error;
  }
}

/**
 * Check and clean up any existing sessions for a user
 * This ensures user starts fresh each time
 */
async function cleanupUserSessions(userId, prisma) {
  try {
    // Find any existing sessions for this user
    const existingSessions = await prisma.session.findMany({
      where: {
        userId: parseInt(userId),
        status: 'IN_PROGRESS'
      }
    });

    // Delete each existing session from both Redis and PostgreSQL
    for (const session of existingSessions) {
      await clearChatSession(session.id);
      await prisma.session.delete({
        where: { id: session.id }
      });
    }

    return {
      success: true,
      cleanedSessions: existingSessions.length,
      message: `Cleaned up ${existingSessions.length} existing sessions`
    };
  } catch (error) {
    console.error('Failed to cleanup user sessions:', error);
    throw error;
  }
}

/**
 * Check if a session exists and is in progress
 */
async function isSessionInProgress(sessionId) {
  try {
    const sessionMessages = await getChatHistory(sessionId);
    return sessionMessages && sessionMessages.length > 0;
  } catch (error) {
    return false;
  }
}

module.exports = {
  completeSession,
  abandonSession,
  getUserCompletedSessions,
  isSessionInProgress,
  cleanupUserSessions
}; 