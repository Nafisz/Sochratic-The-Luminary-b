# Frontend Integration Example

## Session Management Integration

### 1. Memulai Sesi Baru

```javascript
// Ketika user memilih topik untuk dipelajari
async function startNewSession(userId, topicId) {
  try {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        topicId: topicId,
        conversationLog: []
      })
    });
    
    const { session, message } = await response.json();
    console.log('Sesi baru dimulai:', session.id);
    console.log('Pesan:', message); // "New session started. Any previous sessions have been cleaned up."
    
    // Simpan sessionId untuk digunakan dalam chat
    localStorage.setItem('currentSessionId', session.id);
    
    return session;
  } catch (error) {
    console.error('Gagal memulai sesi:', error);
  }
}
```

### 2. Chat dalam Sesi

```javascript
// Mengirim pesan dalam sesi yang sedang berjalan
async function sendMessage(message, topicId, userId) {
  const sessionId = localStorage.getItem('currentSessionId');
  
  if (!sessionId) {
    throw new Error('Tidak ada sesi aktif');
  }
  
  try {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: topicId,
        message: message,
        userId: userId,
        sessionId: sessionId
      })
    });
    
    const { reply } = await response.json();
    return reply;
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
  }
}
```

### 3. Menyelesaikan Sesi (Dapat Exp)

```javascript
// Ketika user selesai belajar dan ingin mendapatkan exp
async function completeSession(userId, topicId) {
  const sessionId = localStorage.getItem('currentSessionId');
  
  if (!sessionId) {
    throw new Error('Tidak ada sesi aktif');
  }
  
  try {
    const response = await fetch(`/api/exp/complete/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        topicId: topicId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Tampilkan hasil exp
      showExpResults(result);
      
      // Hapus sessionId dari localStorage
      localStorage.removeItem('currentSessionId');
      
      // Update UI untuk menampilkan topik sebagai selesai
      updateCompletedTopics();
    }
    
    return result;
  } catch (error) {
    console.error('Gagal menyelesaikan sesi:', error);
  }
}

function showExpResults(result) {
  console.log('🎉 Sesi selesai!');
  console.log('Total EXP:', result.totalExp);
  console.log('Level:', result.level);
  console.log('Exp Breakdown:', result.expPoints);
  
  // Tampilkan di UI
  const expModal = document.getElementById('exp-modal');
  expModal.innerHTML = `
    <h2>🎉 Sesi Selesai!</h2>
    <p>Total EXP: ${result.totalExp}</p>
    <p>Level: ${result.level}</p>
    <div class="exp-breakdown">
      ${result.expPoints.map(point => 
        `<div>${point.element}: ${point.value}</div>`
      ).join('')}
    </div>
  `;
  expModal.style.display = 'block';
}
```

### 4. Meninggalkan Sesi (Tanpa Exp)

```javascript
// Ketika user meninggalkan sesi tanpa menyelesaikan
async function abandonSession() {
  const sessionId = localStorage.getItem('currentSessionId');
  
  if (!sessionId) {
    return;
  }
  
  try {
    const response = await fetch(`/api/session/${sessionId}/abandon`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Sesi ditinggalkan dan dihapus sepenuhnya');
      
      // Hapus sessionId dari localStorage
      localStorage.removeItem('currentSessionId');
      
      // Tampilkan pesan ke user
      showMessage('Sesi ditinggalkan. Progress tidak disimpan dan sesi dihapus sepenuhnya.');
    }
  } catch (error) {
    console.error('Gagal meninggalkan sesi:', error);
  }
}

// Panggil ini ketika user menutup tab/browser atau meninggalkan halaman
window.addEventListener('beforeunload', () => {
  abandonSession();
});

// Panggil ini ketika user menekan tombol "Keluar" atau "Cancel"
document.getElementById('exit-session-btn').addEventListener('click', () => {
  abandonSession();
  // Redirect ke halaman utama atau dashboard
  window.location.href = '/dashboard';
});
```

### 5. Menampilkan Topik yang Terselesaikan

```javascript
// Ambil dan tampilkan daftar topik yang sudah selesai
async function loadCompletedTopics(userId) {
  try {
    const response = await fetch(`/api/exp/completed-sessions/${userId}`);
    const { completedSessions } = await response.json();
    
    const completedTopicsContainer = document.getElementById('completed-topics');
    
    if (completedSessions.length === 0) {
      completedTopicsContainer.innerHTML = '<p>Belum ada topik yang selesai</p>';
      return;
    }
    
    const topicsHTML = completedSessions.map(session => `
      <div class="completed-topic-card">
        <h3>${session.topicTitle}</h3>
        <p class="course-title">${session.courseTitle}</p>
        <p class="completion-date">Selesai: ${new Date(session.completedAt).toLocaleDateString()}</p>
        <div class="exp-summary">
          <span class="total-exp">Total EXP: ${session.totalExp}</span>
          <div class="exp-breakdown">
            ${Object.entries(session.expBreakdown).map(([type, value]) => 
              `<span class="exp-item">${type}: ${value}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `).join('');
    
    completedTopicsContainer.innerHTML = topicsHTML;
  } catch (error) {
    console.error('Gagal memuat topik yang selesai:', error);
  }
}
```

### 6. Dashboard User

```javascript
// Ambil data dashboard user (exp, level, dll)
async function loadUserDashboard(userId) {
  try {
    const response = await fetch(`/api/exp/user/${userId}`);
    const dashboard = await response.json();
    
    // Update UI dengan data dashboard
    document.getElementById('total-exp').textContent = dashboard.totalExp;
    document.getElementById('current-level').textContent = dashboard.level;
    document.getElementById('completed-sessions-count').textContent = dashboard.completedSessionsCount;
    
    // Tampilkan progress bar untuk level
    const progressPercentage = (dashboard.currentExpInLevel / (dashboard.nextLevelExp - dashboard.currentExpInLevel)) * 100;
    document.getElementById('level-progress').style.width = `${progressPercentage}%`;
    
    // Tampilkan breakdown exp per elemen
    const expBreakdownContainer = document.getElementById('exp-breakdown');
    expBreakdownContainer.innerHTML = Object.entries(dashboard.dashboard).map(([element, exp]) => `
      <div class="exp-element">
        <span class="element-name">${element}</span>
        <span class="element-exp">${exp}</span>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Gagal memuat dashboard:', error);
  }
}
```

### 7. Contoh UI Component

```html
<!-- HTML untuk menampilkan topik yang terselesaikan -->
<div class="completed-topics-section">
  <h2>Topik yang Sudah Selesai</h2>
  <div id="completed-topics"></div>
</div>

<!-- HTML untuk dashboard -->
<div class="user-dashboard">
  <div class="dashboard-header">
    <h2>Dashboard</h2>
    <div class="level-info">
      <span>Level: <span id="current-level">1</span></span>
      <div class="level-progress-bar">
        <div id="level-progress" class="level-progress"></div>
      </div>
    </div>
  </div>
  
  <div class="exp-summary">
    <div class="total-exp">Total EXP: <span id="total-exp">0</span></div>
    <div class="sessions-count">Sesi Selesai: <span id="completed-sessions-count">0</span></div>
  </div>
  
  <div class="exp-breakdown">
    <h3>Breakdown EXP</h3>
    <div id="exp-breakdown"></div>
  </div>
</div>

<!-- Modal untuk hasil exp -->
<div id="exp-modal" class="modal" style="display: none;">
  <!-- Content akan diisi oleh JavaScript -->
</div>
```

### 8. CSS Styling

```css
.completed-topic-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #f9f9f9;
}

.exp-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.exp-item {
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.level-progress-bar {
  width: 200px;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.level-progress {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal > div {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
}
```

### 9. Inisialisasi

```javascript
// Inisialisasi aplikasi
async function initializeApp() {
  const userId = getCurrentUserId(); // Implementasi sesuai auth system
  
  // Load dashboard
  await loadUserDashboard(userId);
  
  // Load completed topics
  await loadCompletedTopics(userId);
  
  // Setup event listeners
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Event untuk menyelesaikan sesi
  document.getElementById('complete-session-btn').addEventListener('click', () => {
    const userId = getCurrentUserId();
    const topicId = getCurrentTopicId();
    completeSession(userId, topicId);
  });
  
  // Event untuk meninggalkan sesi
  document.getElementById('abandon-session-btn').addEventListener('click', () => {
    abandonSession();
  });
}

// Jalankan aplikasi
document.addEventListener('DOMContentLoaded', initializeApp);
```

Dengan implementasi ini, frontend akan:

1. **Hanya menyimpan sesi yang selesai** ke database dan Qdrant
2. **Menampilkan topik yang terselesaikan** dengan detail exp
3. **Memberikan feedback yang jelas** kepada user tentang progress mereka
4. **Mengelola state sesi** dengan baik (mulai, chat, selesai, abandon)
5. **Menampilkan dashboard** yang akurat berdasarkan sesi yang selesai saja 