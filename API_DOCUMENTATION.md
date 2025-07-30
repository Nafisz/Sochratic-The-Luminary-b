# API Documentation

## Overview
This API provides a comprehensive learning system with automatic mode switching, session-based analysis, and intelligent AI responses.

## Core Features

### ✅ **Automatic Mode System**
- **DEFAULT**: Normal chat with automatic concept detection
- **EXPLAIN_CONCEPT**: Automatic concept explanation when needed
- **REQUEST_SOLUTION**: Frontend-triggered solution request
- **ENTER_IMPLEMENTATION**: Frontend-triggered code implementation
- **ACTIVE_RECALL**: Frontend-triggered understanding test

### ✅ **Session-Based Analysis**
- All conversations stored in Redis as single sessions
- Complete conversation analysis at session end
- EXP calculation based on full context
- Embedding storage in Qdrant for long-term memory

### ✅ **Intelligent AI Responses**
- Automatic detection of user needs
- Context-aware responses
- Tag-based EXP rewards
- Seamless mode transitions

## API Endpoints

### **1. Chat System**

#### **POST /api/chat/message**
Send a message and get AI response with automatic mode detection.

**Request:**
```javascript
{
  "topicId": 5,
  "message": "Saya bingung dengan variable",
  "userId": 1,
  "sessionId": 123,
  "mode": "DEFAULT" // Optional: DEFAULT, EXPLAIN_CONCEPT, REQUEST_SOLUTION, ENTER_IMPLEMENTATION, ACTIVE_RECALL
}
```

**Response:**
```javascript
{
  "reply": "Variable adalah container untuk menyimpan data. Dalam JavaScript, Anda mendeklarasikan variable menggunakan `let`, `const`, atau `var`. <MATERIAL_TYPE=DEFINITION>"
}
```

**Mode Detection Logic:**
- **DEFAULT**: AI automatically detects if user needs concept explanation
- **EXPLAIN_CONCEPT**: AI provides detailed concept explanation with `<MATERIAL_TYPE=...>`
- **REQUEST_SOLUTION**: AI asks user to provide final solution
- **ENTER_IMPLEMENTATION**: AI creates code implementation with `<IMPLEMENTATION_START>`
- **ACTIVE_RECALL**: AI provides test questions with `<ACTIVE_RECALL_MODE>`

### **2. Session Management**

#### **POST /api/session**
Create a new learning session.

**Request:**
```javascript
{
  "userId": 1,
  "topicId": 5
}
```

**Response:**
```javascript
{
  "sessionId": "session_123",
  "userId": 1,
  "topicId": 5,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### **GET /api/session/:id/summary**
Get session summary without processing.

**Response:**
```javascript
{
  "sessionId": "session_123",
  "messageCount": 8,
  "hasData": true,
  "preview": [
    "user: Apa itu variable?",
    "assistant: Coba pikirkan...",
    "user: Saya masih bingung"
  ]
}
```

#### **POST /api/session/:id/analyze**
Trigger complete session analysis (AI assessment, EXP calculation, embedding storage).

**Request:**
```javascript
{
  "userId": 1,
  "topicId": 5
}
```

**Response:**
```javascript
{
  "success": true,
  "sessionId": "session_123",
  "expPoints": [
    { "element": "clarity", "value": 85 },
    { "element": "accuracy", "value": 90 },
    { "element": "depth", "value": 75 }
  ],
  "messageCount": 8,
  "totalExp": 250,
  "elements": ["clarity", "accuracy", "depth"]
}
```

### **3. User Experience Flow**

#### **Stage 1: Default Chat**
```javascript
// User sends message
POST /api/chat/message
{
  "message": "Apa itu variable?",
  "mode": "DEFAULT"
}

// AI responds with Socratic approach
// If AI detects user needs explanation → automatically switches to EXPLAIN_CONCEPT
```

#### **Stage 2: Concept Explanation (Automatic)**
```javascript
// AI automatically provides explanation
{
  "reply": "Variable adalah container untuk menyimpan data... <MATERIAL_TYPE=DEFINITION>"
}
```

#### **Stage 3: Solution Request (Frontend Trigger)**
```javascript
// User clicks "Continue" in frontend
POST /api/chat/message
{
  "message": "Lanjutkan",
  "mode": "REQUEST_SOLUTION"
}

// AI asks for final solution
{
  "reply": "Bagus! Sekarang coba buat program yang menyimpan nama user..."
}
```

#### **Stage 4: Implementation (Frontend Trigger)**
```javascript
// User clicks "Continue" again
POST /api/chat/message
{
  "message": "Lanjutkan",
  "mode": "ENTER_IMPLEMENTATION"
}

// AI provides code implementation
{
  "reply": "Excellent! Mari kita buat versi lengkapnya... <IMPLEMENTATION_START> <EXP_ADD=50>"
}
```

#### **Stage 5: Active Recall (Frontend Trigger)**
```javascript
// User clicks final "Continue"
POST /api/chat/message
{
  "message": "Lanjutkan",
  "mode": "ACTIVE_RECALL"
}

// AI provides test questions
{
  "reply": "Mari kita test pemahaman Anda... <ACTIVE_RECALL_MODE>"
}
```

#### **Stage 6: Session Analysis**
```javascript
// Complete session analysis
POST /api/session/session_123/analyze
{
  "userId": 1,
  "topicId": 5
}

// Returns comprehensive EXP assessment
```

## Benefits

### ✅ **Context Preservation**
- All conversations maintained in single Redis session
- AI has full context for accurate assessment
- No information loss during mode transitions

### ✅ **Efficient Processing**
- Batch processing at session end
- Reduced API calls for EXP calculation
- Optimized resource usage

### ✅ **Data Integrity**
- Atomic session operations
- Consistent EXP calculation
- Reliable embedding storage

### ✅ **Scalable Architecture**
- Session-based processing
- Redis for temporary storage
- Qdrant for long-term memory

## Error Handling

### **Common Error Responses:**
```javascript
// Missing required fields
{
  "error": "topicId, message, and sessionId are required"
}

// Session not found
{
  "error": "No session data found in Redis"
}

// Invalid mode
{
  "error": "Invalid mode. Valid modes: DEFAULT, EXPLAIN_CONCEPT, REQUEST_SOLUTION, ENTER_IMPLEMENTATION, ACTIVE_RECALL"
}
```

## Migration from Old System

### **Old Per-Message Analysis (Deprecated)**
```javascript
// OLD: POST /api/ai/analyze (returns 410 Gone)
// NEW: Use session-based analysis instead
```

### **New Session-Based Analysis**
```javascript
// 1. Create session
POST /api/session

// 2. Send messages (all modes supported)
POST /api/chat/message

// 3. Analyze complete session
POST /api/session/:id/analyze
```

## Technical Details

### **Mode Detection Tags:**
- `<MATERIAL_TYPE=...>` - Concept explanation
- `<FINAL_SOLUTION=YES>` - Solution request
- `<IMPLEMENTATION_START>` - Code implementation
- `<ACTIVE_RECALL_MODE>` - Test questions
- `<EXP_ADD=...>` - EXP rewards

### **Session Storage:**
- **Redis**: Temporary conversation storage
- **PostgreSQL**: User data, sessions, EXP points
- **Qdrant**: Long-term conversation embeddings

### **AI Models:**
- **Chat**: GPT-4 for responses
- **Analysis**: GPT-4o for session assessment
- **Embeddings**: text-embedding-3-small for vector storage 