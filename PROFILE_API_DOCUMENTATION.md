# Profile API Documentation

## Overview
Profile API menyediakan endpoint untuk mengelola profil pengguna dengan fitur JWT authentication. API ini memungkinkan pengguna untuk melihat dan mengubah informasi profil mereka.

## Base URL
```
http://localhost:3000/api/profile
```

## Authentication
Semua endpoint memerlukan JWT token yang valid di header Authorization:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get User Profile
**GET** `/api/profile`

Mengambil data profil pengguna yang sedang login.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "age": 25,
    "email": "john@example.com",
    "createdAt": {
      "month": 12,
      "year": 2024
    },
    "intelligenceProgress": [
      {
        "type": "Clarity",
        "exp": 150,
        "level": 3
      },
      {
        "type": "Accuracy",
        "exp": 200,
        "level": 4
      }
    ]
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "User not found"
}
```

### 2. Update User Profile
**PUT** `/api/profile`

Mengubah data profil pengguna.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Smith",
  "username": "johnsmith",
  "age": 26
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Smith",
    "username": "johnsmith",
    "age": 26,
    "email": "john@example.com",
    "createdAt": {
      "month": 12,
      "year": 2024
    }
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Username already taken"
}
```

### 3. Get User Statistics
**GET** `/api/profile/stats`

Mengambil statistik pengguna termasuk jumlah sesi dan progress intelligence.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "totalSessions": 15,
    "totalExperience": 1250,
    "intelligenceLevels": [
      {
        "type": "Clarity",
        "level": 3,
        "exp": 150
      },
      {
        "type": "Accuracy",
        "level": 4,
        "exp": 200
      }
    ]
  }
}
```

## Data Structure

### Profile Object
```json
{
  "id": "number",
  "name": "string",
  "username": "string",
  "age": "number",
  "email": "string",
  "createdAt": {
    "month": "number (1-12)",
    "year": "number"
  },
  "intelligenceProgress": [
    {
      "type": "string (enum: Clarity, Accuracy, Precision, Relevance, Depth, Breadth, Logic, Significance, Fairness)",
      "exp": "number",
      "level": "number"
    }
  ]
}
```

### Update Profile Fields
- `name` (optional): Nama lengkap pengguna
- `username` (optional): Username unik
- `age` (optional): Usia pengguna

## Error Handling

### Common Error Messages
- `"User not found"` - User ID tidak ditemukan
- `"Username already taken"` - Username sudah digunakan user lain
- `"No valid fields to update"` - Tidak ada field yang valid untuk diupdate
- `"Failed to get user profile"` - Gagal mengambil profil user
- `"Failed to update user profile"` - Gagal mengupdate profil user
- `"Failed to get user stats"` - Gagal mengambil statistik user

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (JWT invalid/missing)
- `500` - Internal Server Error

## Example Usage

### JavaScript (Fetch API)
```javascript
// Get user profile
const getProfile = async () => {
  const response = await fetch('http://localhost:3000/api/profile', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`
    }
  });
  const data = await response.json();
  return data;
};

// Update user profile
const updateProfile = async (profileData) => {
  const response = await fetch('http://localhost:3000/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  const data = await response.json();
  return data;
};

// Get user statistics
const getStats = async () => {
  const response = await fetch('http://localhost:3000/api/profile/stats', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`
    }
  });
  const data = await response.json();
  return data;
};
```

### cURL Examples
```bash
# Get profile
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:3000/api/profile

# Update profile
curl -X PUT \
     -H "Authorization: Bearer <jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "New Name", "age": 27}' \
     http://localhost:3000/api/profile

# Get stats
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:3000/api/profile/stats
```

## Notes
- Semua endpoint memerlukan JWT token yang valid
- Field `createdAt` otomatis diisi saat user pertama kali dibuat
- Username harus unik di seluruh sistem
- Hanya field `name`, `username`, dan `age` yang dapat diupdate
- Progress intelligence diambil dari tabel `UserIntelProgress`
