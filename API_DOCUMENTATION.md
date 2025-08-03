# API Documentation - Sochratic The Luminary

## Session Management Flow

### New Session Management Logic

Sistem sekarang menggunakan logika berikut untuk mengelola sesi:

1. **Sesi Dimulai**: Sesi dibuat dengan status `IN_PROGRESS` dan disimpan di Redis
   - **Otomatis membersihkan** sesi yang sedang berjalan sebelumnya untuk user yang sama
2. **Sesi Berjalan**: Percakapan hanya disimpan di Redis, tidak di database atau Qdrant
3. **Sesi Selesai**: Jika user menyelesaikan sampai tahap pembagian exp, sesi disimpan ke database dan Qdrant
4. **Sesi Ditinggalkan**: Jika user tidak menyelesaikan, sesi **DIHAPUS SEPENUHNYA** dari Redis dan PostgreSQL

### Alur Detail:

```
1. User Memilih Topik
   ↓
2. POST /api/session
   ├─ Cleanup existing sessions (Redis + PostgreSQL)
   ├─ Create new session (status: IN_PROGRESS)
   └─ Save to Redis
   ↓
3. Chat dalam Sesi (hanya di Redis)
   ↓
4. User Menyelesaikan?
   ├─ Ya → POST /api/exp/complete/:sessionId
   │        ↓
   │        - AI Analysis untuk EXP
   │        - Embedding ke Qdrant
   │        - Save ke Database (status: COMPLETED)
   │        - Clear Redis
   │
   └─ Tidak → POST /api/session/:id/abandon
              ↓
              - DELETE dari Redis
              - DELETE dari PostgreSQL
              - Tidak ada trace sama sekali
```

### Endpoints

#### Session Management

**POST /api/session**
- Membuat sesi baru dengan status `IN_PROGRESS`
- **Otomatis membersihkan** sesi yang sedang berjalan sebelumnya untuk user yang sama
- Body: `{ userId, topicId, conversationLog? }`
- Response: `{ session, message }`

**POST /api/session/:id/abandon**
- **Menghapus sesi sepenuhnya** dari Redis dan PostgreSQL
- Tidak ada trace sama sekali di sistem
- Response: `{ success: true, sessionId, message }`

**GET /api/session/:id/status**
- Mengecek apakah sesi masih berjalan
- Response: `{ sessionId, inProgress, message }`

**GET /api/session/:id/summary**
- Mendapatkan ringkasan sesi dari Redis
- Response: `{ sessionId, messageCount, hasData, preview }`

#### Experience Points

**POST /api/exp/complete/:sessionId**
- Menyelesaikan sesi dan memberikan exp
- Body: `{ userId, topicId }`
- Proses:
  1. Analisis AI untuk exp points
  2. Embedding ke Qdrant
  3. Simpan ke database
  4. Update status sesi menjadi `COMPLETED`
  5. Hapus dari Redis
- Response: `{ success, sessionId, expPoints, totalExp, level, message }`

**GET /api/exp/completed-sessions/:userId**
- Mendapatkan daftar sesi yang sudah selesai
- Response: `{ success, completedSessions, count }`

**GET /api/exp/user/:userId**
- Dashboard exp user (hanya sesi yang selesai)
- Response: `{ dashboard, totalExp, level, currentExpInLevel, nextLevelExp, completedSessionsCount }`

#### Chat

**POST /api/chat/message**
- Mengirim pesan dalam sesi
- Body: `{ topicId, message, userId, sessionId, mode? }`
- Response: `{ reply }`

### Frontend Integration

#### Untuk menampilkan topik yang terselesaikan:

```javascript
// Ambil sesi yang sudah selesai
const response = await fetch(`/api/exp/completed-sessions/${userId}`);
const { completedSessions } = await response.json();

// Tampilkan di frontend
completedSessions.forEach(session => {
  console.log(`Topik: ${session.topicTitle}`);
  console.log(`Kursus: ${session.courseTitle}`);
  console.log(`Selesai: ${session.completedAt}`);
  console.log(`Total EXP: ${session.totalExp}`);
});
```

#### Untuk menyelesaikan sesi:

```javascript
// Ketika user selesai belajar dan ingin mendapatkan exp
const response = await fetch(`/api/exp/complete/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, topicId })
});

const result = await response.json();
// result akan berisi exp points, level, dll
```

#### Untuk meninggalkan sesi:

```javascript
// Ketika user meninggalkan sesi tanpa menyelesaikan
const response = await fetch(`/api/session/${sessionId}/abandon`, {
  method: 'POST'
});

const result = await response.json();
// Sesi akan dihapus dari Redis tanpa disimpan ke database
```

### Database Schema Updates

Model `Session` sekarang memiliki field tambahan:
- `status`: `IN_PROGRESS`, `COMPLETED`, atau `ABANDONED`
- `completedAt`: Timestamp kapan sesi selesai

### Keuntungan Sistem Baru

1. **Efisiensi Storage**: Hanya sesi yang selesai yang disimpan ke database
2. **Kualitas Data**: Data di Qdrant hanya dari sesi yang bermakna
3. **User Experience**: User bisa melihat progress yang sebenarnya
4. **Performance**: Mengurangi beban database dan Qdrant

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