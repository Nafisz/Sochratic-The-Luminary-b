# API Documentation - Session-Based Analysis System

## Overview
This system analyzes learning sessions holistically by reading the entire conversation from Redis, analyzing it with AI, converting to EXP points, embedding to Qdrant, and cleaning up the cache.

### AI Assessment System
The AI evaluates student performance across 9 cognitive dimensions with calculated scores (0-100):

**Scoring Scale:**
- **0-20**: Poor performance, significant misunderstandings
- **21-40**: Below average, some understanding but major gaps  
- **41-60**: Average performance, basic understanding with room for improvement
- **61-80**: Good performance, solid understanding with some depth
- **81-100**: Excellent performance, deep understanding and sophisticated thinking

**Assessment Dimensions:**
- **Clarity**: How clearly did the student express their thoughts?
- **Accuracy**: How accurate were the student's answers and concepts?
- **Precision**: How precise and specific were the student's responses?
- **Relevance**: How relevant were the student's answers to the topic?
- **Depth**: How deep was the student's understanding and analysis?
- **Breadth**: How comprehensive was the student's knowledge?
- **Logic**: How logical and well-reasoned were the student's arguments?
- **Significance**: How meaningful were the student's contributions?
- **Fairness**: How balanced and objective was the student's perspective?

## Session Management

### 1. Create New Session
**POST** `/api/session`

Creates a new session and stores initial conversation log in Redis.

**Request Body:**
```json
{
  "userId": 1,
  "topic": "JavaScript Fundamentals",
  "conversationLog": []
}
```

**Response:**
```json
{
  "session": {
    "id": 123,
    "userId": 1,
    "topic": "JavaScript Fundamentals",
    "createdAt": "2025-07-30T00:00:00.000Z"
  }
}
```

### 2. Get Session Summary
**GET** `/api/session/:id/summary`

Gets a summary of the session from Redis without processing.

**Response:**
```json
{
  "sessionId": 123,
  "messageCount": 15,
  "hasData": true,
  "preview": [
    "user: What is a variable?",
    "assistant: A variable is a container for storing data...",
    "user: How do I declare one?"
  ]
}
```

### 3. Analyze Session (Complete Workflow)
**POST** `/api/session/:id/analyze`

**Complete session analysis workflow:**
1. ✅ Read entire session from Redis
2. ✅ Analyze with AI for EXP conversion
3. ✅ Embed conversation to Qdrant
4. ✅ Clean up Redis cache
5. ✅ Save EXP points to database

**Request Body:**
```json
{
  "userId": 1,
  "topicId": 5
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": 123,
     "expPoints": [
     { "element": "Clarity", "value": 85 },
     { "element": "Accuracy", "value": 78 },
     { "element": "Precision", "value": 72 },
     { "element": "Relevance", "value": 90 },
     { "element": "Depth", "value": 68 },
     { "element": "Breadth", "value": 65 },
     { "element": "Logic", "value": 82 },
     { "element": "Significance", "value": 75 },
     { "element": "Fairness", "value": 80 }
   ],
  "messageCount": 15,
  "totalExp": 650,
  "totalExp": 1250,
  "level": 3,
  "message": "Session analyzed and processed successfully"
}
```

### 4. Get Session with EXP Points
**GET** `/api/session/:id/points`

Gets session details with EXP points from database.

**Response:**
```json
{
  "id": 123,
  "userId": 1,
  "topic": "JavaScript Fundamentals",
  "createdAt": "2025-07-30T00:00:00.000Z",
  "expPoints": [
    {
      "id": 1,
      "element": "Clarity",
      "value": 75,
      "sessionId": 123
    }
  ]
}
```

## Chat System

### Send Message
**POST** `/api/chat/message`

Sends a message and gets AI response. Tags are preserved for session analysis.

**Request Body:**
```json
{
  "topicId": 5,
  "message": "What is a variable?",
  "userId": 1,
  "sessionId": 123
}
```

**Response:**
```json
{
  "reply": "A variable is a container for storing data values. In JavaScript, you declare variables using keywords like `let`, `const`, or `var`. <CONCEPT_TYPE=DEFINITION>"
}
```

## User Experience Flow

### 1. Start Learning Session
```javascript
// 1. Create session
const session = await fetch('/api/session', {
  method: 'POST',
  body: JSON.stringify({
    userId: 1,
    topic: "JavaScript Fundamentals"
  })
});

// 2. Start chatting
const response = await fetch('/api/chat/message', {
  method: 'POST',
  body: JSON.stringify({
    topicId: 5,
    message: "What is a variable?",
    userId: 1,
    sessionId: session.id
  })
});
```

### 2. End and Analyze Session
```javascript
// 3. When session is complete, analyze it
const analysis = await fetch(`/api/session/${session.id}/analyze`, {
  method: 'POST',
  body: JSON.stringify({
    userId: 1,
    topicId: 5
  })
});

// 4. Show results to user
console.log(`You earned ${analysis.totalExp} EXP!`);
console.log(`Your level: ${analysis.level}`);
```

## Benefits of This Approach

### ✅ **Context Preservation**
- AI analyzes entire conversation, not just individual messages
- Maintains learning progression and context
- More accurate assessment of understanding

### ✅ **Efficient Processing**
- Single AI call per session instead of per message
- Reduced API costs and processing time
- Better resource utilization

### ✅ **Data Integrity**
- Complete conversation preserved in Qdrant
- EXP points based on holistic analysis
- Clean Redis cache management

### ✅ **Scalable Architecture**
- Session-based processing scales better
- Easier to implement batch processing
- Better error handling and recovery

## Error Handling

### Common Error Responses

**Session Not Found:**
```json
{
  "error": "Session not found or empty."
}
```

**Missing Parameters:**
```json
{
  "error": "userId and topicId are required for session analysis"
}
```

**Analysis Failed:**
```json
{
  "error": "Failed to analyze session: No session data found in Redis"
}
```

## Migration from Old System

The old per-message analysis system (`/api/ai`) has been deprecated. Use the new session-based analysis for better results and performance.

**Old (Deprecated):**
```javascript
// ❌ Don't use this anymore
fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({ conversation, sessionId, userId })
});
```

**New (Recommended):**
```javascript
// ✅ Use this instead
fetch(`/api/session/${sessionId}/analyze`, {
  method: 'POST',
  body: JSON.stringify({ userId, topicId })
});
``` 