# Frontend Integration Guide

## Cara Mengakses Backend API dari Frontend di Folder Berbeda

### 1. Konfigurasi Environment Variables

Tambahkan environment variable berikut di file `.env` frontend Anda:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api
# atau
REACT_APP_API_URL=http://localhost:3000/api
# atau
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Contoh Konfigurasi untuk Berbagai Framework

#### React (Create React App)
```javascript
// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Untuk cookies dan auth
};
```

#### React (Vite)
```javascript
// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};
```

#### Vue.js
```javascript
// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};
```

#### Angular
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### 3. Contoh Penggunaan dengan Axios

```javascript
import axios from 'axios';
import { apiConfig } from './config/api';

// Membuat instance axios
const api = axios.create(apiConfig);

// Contoh request ke API
export const authService = {
  // Login
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get user profile
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export const chatService = {
  // Send message
  async sendMessage(message) {
    const response = await api.post('/chat/send', { message });
    return response.data;
  },

  // Get chat history
  async getChatHistory() {
    const response = await api.get('/chat/history');
    return response.data;
  }
};

export const sessionService = {
  // Create new session
  async createSession(topicId) {
    const response = await api.post('/session/create', { topicId });
    return response.data;
  },

  // Get session by ID
  async getSession(sessionId) {
    const response = await api.get(`/session/${sessionId}`);
    return response.data;
  },

  // Complete session
  async completeSession(sessionId) {
    const response = await api.put(`/session/${sessionId}/complete`);
    return response.data;
  }
};

export const topicService = {
  // Get all topics
  async getTopics() {
    const response = await api.get('/topic');
    return response.data;
  },

  // Get topic by ID
  async getTopic(topicId) {
    const response = await api.get(`/topic/${topicId}`);
    return response.data;
  }
};

export const expService = {
  // Get user experience points
  async getUserExp() {
    const response = await api.get('/exp/user');
    return response.data;
  },

  // Add experience points
  async addExp(type, value) {
    const response = await api.post('/exp/add', { type, value });
    return response.data;
  }
};
```

### 4. Contoh Penggunaan dengan Fetch API

```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Untuk cookies
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  // Chat methods
  async sendMessage(message) {
    return this.request('/chat/send', {
      method: 'POST',
      body: { message },
    });
  }

  // Session methods
  async createSession(topicId) {
    return this.request('/session/create', {
      method: 'POST',
      body: { topicId },
    });
  }

  // Topic methods
  async getTopics() {
    return this.request('/topic', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
```

### 5. Error Handling

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Forbidden
        console.error('Access denied:', data.message);
        break;
      case 404:
        // Not found
        console.error('Resource not found:', data.message);
        break;
      case 500:
        // Server error
        console.error('Server error:', data.message);
        break;
      default:
        console.error('API Error:', data.message);
    }
  } else if (error.request) {
    // Network error
    console.error('Network error:', error.message);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
};
```

### 6. Authentication Token Handling

```javascript
// src/utils/auth.js
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
    // Set default header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
```

### 7. CORS Troubleshooting

Jika Anda mengalami masalah CORS, pastikan:

1. Backend sudah berjalan di port yang benar (3000)
2. Frontend menggunakan URL yang sudah diizinkan dalam konfigurasi CORS
3. Request menggunakan credentials yang benar
4. Headers yang dikirim sesuai dengan yang diizinkan

### 8. Development vs Production

```javascript
// src/config/api.js
const isDevelopment = process.env.NODE_ENV === 'development';

const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000/api'
  : 'https://your-production-domain.com/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};
```

### 9. Testing API Connection

```javascript
// Test koneksi ke API
const testApiConnection = async () => {
  try {
    const response = await fetch('http://localhost:3000/');
    const data = await response.json();
    console.log('API Status:', data);
    return true;
  } catch (error) {
    console.error('API Connection Failed:', error);
    return false;
  }
};

// Panggil fungsi ini saat aplikasi dimuat
testApiConnection();
```

## Endpoints yang Tersedia

- `GET /` - Health check
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `POST /api/chat/send` - Kirim pesan chat
- `GET /api/chat/history` - Ambil riwayat chat
- `POST /api/session/create` - Buat session baru
- `GET /api/session/:id` - Ambil session by ID
- `PUT /api/session/:id/complete` - Selesaikan session
- `GET /api/topic` - Ambil semua topic
- `GET /api/topic/:id` - Ambil topic by ID
- `GET /api/exp/user` - Ambil exp user
- `POST /api/exp/add` - Tambah exp user 