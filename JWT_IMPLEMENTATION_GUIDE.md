# JWT Implementation Guide

## Overview
JWT (JSON Web Token) telah berhasil diimplementasikan ke dalam sistem autentikasi yang ada tanpa mengubah fungsi yang sudah berjalan.

## Fitur yang Ditambahkan

### 1. JWT Token Generation
- **Register**: Sekarang mengembalikan JWT token setelah registrasi berhasil
- **Login**: Sekarang mengembalikan JWT token setelah login berhasil
- **Token Expiry**: Token berlaku selama 24 jam

### 2. Endpoint Baru
- `POST /api/auth/refresh` - Refresh token yang sudah expired
- `GET /api/auth/verify` - Verifikasi validitas token

### 3. Middleware JWT
- `authenticateToken` - Melindungi route yang membutuhkan autentikasi penuh
- `optionalAuth` - Autentikasi opsional (tidak memblokir request)

### 4. Route yang Dilindungi
- `GET /api/protected/profile` - Mendapatkan profil user (memerlukan autentikasi)
- `PUT /api/protected/profile` - Update profil user (memerlukan autentikasi)
- `GET /api/protected/public-data` - Data publik dengan autentikasi opsional

## Konfigurasi

### Environment Variables
Tambahkan ke file `.env`:
```env
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
```

### Dependencies
JWT dependency telah ditambahkan:
```bash
npm install jsonwebtoken
```

## Cara Penggunaan

### 1. Register/Login
```javascript
// Register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'username',
    password: 'password',
    name: 'User Name',
    age: 25
  })
});

const { token, user } = await response.json();

// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { token, user } = await loginResponse.json();
```

### 2. Menggunakan Token untuk Request yang Dilindungi
```javascript
// Mendapatkan profil user
const profileResponse = await fetch('/api/protected/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const profile = await profileResponse.json();
```

### 3. Refresh Token
```javascript
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: oldToken })
});

const { token: newToken, user } = await refreshResponse.json();
```

### 4. Verifikasi Token
```javascript
const verifyResponse = await fetch('/api/auth/verify', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { valid, user } = await verifyResponse.json();
```

## Struktur Token

Token JWT berisi informasi user berikut:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Keamanan

### Best Practices
1. **JWT_SECRET**: Gunakan secret key yang kuat dan unik
2. **Token Expiry**: Token otomatis expired setelah 24 jam
3. **HTTPS**: Selalu gunakan HTTPS di production
4. **Secret Storage**: Jangan commit JWT_SECRET ke repository

### Token Storage
- **Frontend**: Simpan token di localStorage atau sessionStorage
- **Mobile**: Simpan token di secure storage
- **Never**: Jangan simpan token di cookie yang tidak secure

## Error Handling

### Common Error Responses
```json
// Token tidak ada
{
  "error": "Access token required"
}

// Token expired
{
  "error": "Token expired"
}

// Token invalid
{
  "error": "Invalid token"
}
```

## Testing

### Test Endpoints
1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Protected Route**: `GET /api/protected/profile`
4. **Token Refresh**: `POST /api/auth/refresh`
5. **Token Verify**: `GET /api/auth/verify`

### Test dengan cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password","name":"Test User","age":25}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Access protected route
curl -X GET http://localhost:3000/api/protected/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Integrasi dengan Frontend

### React Example
```javascript
import { useState, useEffect } from 'react';

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return { token, user, login, logout };
};
```

### Vue.js Example
```javascript
// store/auth.js
export default {
  state: {
    token: localStorage.getItem('token') || null,
    user: null
  },
  
  mutations: {
    setToken(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    
    setUser(state, user) {
      state.user = user;
    },
    
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const { token, user } = await response.json();
      commit('setToken', token);
      commit('setUser', user);
    }
  }
};
```

## Troubleshooting

### Common Issues
1. **Token Expired**: Gunakan endpoint refresh untuk mendapatkan token baru
2. **CORS Issues**: Pastikan frontend domain sudah ditambahkan ke CORS configuration
3. **Invalid Token**: Pastikan token dikirim dengan format `Bearer TOKEN`

### Debug Mode
Untuk debugging, tambahkan logging di middleware:
```javascript
console.log('Token:', token);
console.log('Decoded:', decoded);
```

## Migration Notes

### Tidak Ada Breaking Changes
- Semua endpoint existing tetap berfungsi seperti sebelumnya
- Response format tetap sama, hanya ditambahkan field `token`
- Middleware JWT tidak mempengaruhi route yang sudah ada

### Backward Compatibility
- Frontend yang sudah ada tidak perlu diubah
- Jika tidak menggunakan token, aplikasi tetap berjalan normal
- Token hanya ditambahkan sebagai fitur tambahan


