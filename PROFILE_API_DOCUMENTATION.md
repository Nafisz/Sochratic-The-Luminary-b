# Profile Management API Documentation

## Overview
This API provides comprehensive profile management functionality including bio, profile photo, and real-time online/offline status using Prisma (PostgreSQL) for persistent data and Redis for real-time status tracking.

## Base URL
```
http://localhost:3000/api/profile
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get User Profile
**GET** `/profile`

Retrieves the current user's profile information including bio, profile photo, and online status.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "age": 25,
    "bio": "Software developer passionate about AI",
    "profilePhoto": "https://example.com/photo.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "isOnline": true
  }
}
```

### 2. Update User Profile
**PUT** `/profile`

Updates the user's bio and/or profile photo.

**Request Body:**
```json
{
  "bio": "Updated bio text",
  "profilePhoto": "https://example.com/new-photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "age": 25,
    "bio": "Updated bio text",
    "profilePhoto": "https://example.com/new-photo.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

### 3. Set User Online Status
**POST** `/status/online`

Sets the user's status to online.

**Response:**
```json
{
  "success": true,
  "message": "User online"
}
```

### 4. Set User Offline Status
**POST** `/status/offline`

Sets the user's status to offline.

**Response:**
```json
{
  "success": true,
  "message": "User offline"
}
```

### 5. Get User Status
**GET** `/status`

Retrieves the current user's online/offline status and last seen timestamp.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "online",
    "lastSeen": "2024-01-01T12:00:00.000Z"
  }
}
```

### 6. Send Heartbeat
**POST** `/heartbeat`

Sends a heartbeat to keep the user's online status active. Useful for maintaining online presence.

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat received"
}
```

### 7. Get Online Users
**GET** `/online-users`

Retrieves a list of all currently online users. This endpoint is public and doesn't require authentication.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "profilePhoto": "https://example.com/photo.jpg"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "username": "janesmith",
      "profilePhoto": null
    }
  ],
  "count": 2
}
```

## Data Models

### User Profile (Prisma)
```prisma
model User {
  id                Int                 @id @default(autoincrement())
  name              String
  username          String              @unique
  password          String
  age               Int
  email             String              @unique
  bio               String?             // User biography/description
  profilePhoto      String?             // URL or path to profile photo
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  // ... other fields
}
```

### Online Status (Redis)
```json
{
  "status": "online|offline",
  "lastSeen": "ISO-8601 timestamp"
}
```

## Redis Key Structure

### User Status
- **Key:** `user:{userId}:status`
- **TTL:** 300 seconds (5 minutes) for online, 86400 seconds (24 hours) for offline
- **Value:** JSON string with status and lastSeen

### Online Users List
- **Key:** `online_users`
- **Type:** Set
- **TTL:** 300 seconds (5 minutes)
- **Value:** Set of user IDs currently online

## Implementation Details

### Online Status Management
1. **Online Status:** Set with 5-minute TTL, automatically expires if no heartbeat
2. **Offline Status:** Set with 24-hour TTL for historical tracking
3. **Heartbeat System:** Extends online status TTL by 5 minutes
4. **Auto-cleanup:** Expired online statuses are automatically removed

### Profile Photo Storage
- Store URLs or file paths in the database
- No file upload handling in this API (implement separately)
- Supports any image format accessible via URL

### Bio Management
- Text field with no length restrictions
- HTML/special characters should be sanitized on frontend
- Supports markdown-style formatting (if needed)

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Bio must be a string"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to update profile"
}
```

## Usage Examples

### Frontend Integration

#### React Example
```javascript
import { useState, useEffect } from 'react';

const ProfileManager = () => {
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  // Get profile
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProfile(data.data);
      setIsOnline(data.data.isOnline);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Update profile
  const updateProfile = async (bio, profilePhoto) => {
    try {
      const response = await fetch('/api/profile/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio, profilePhoto })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Set online status
  const goOnline = async () => {
    try {
      await fetch('/api/profile/status/online', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsOnline(true);
    } catch (error) {
      console.error('Error setting online status:', error);
    }
  };

  // Heartbeat system
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(async () => {
        try {
          await fetch('/api/profile/heartbeat', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
          setIsOnline(false);
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOnline]);

  return (
    <div>
      {/* Profile display and edit form */}
    </div>
  );
};
```

#### Vanilla JavaScript Example
```javascript
class ProfileManager {
  constructor(token) {
    this.token = token;
    this.apiBase = '/api/profile';
  }

  async getProfile() {
    const response = await fetch(`${this.apiBase}/profile`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async updateProfile(bio, profilePhoto) {
    const response = await fetch(`${this.apiBase}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ bio, profilePhoto })
    });
    return await response.json();
  }

  async setOnlineStatus(isOnline) {
    const endpoint = isOnline ? '/status/online' : '/status/offline';
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async sendHeartbeat() {
    const response = await fetch(`${this.apiBase}/heartbeat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async getOnlineUsers() {
    const response = await fetch(`${this.apiBase}/online-users`);
    return await response.json();
  }
}

// Usage
const profileManager = new ProfileManager('your-jwt-token');
profileManager.getProfile().then(console.log);
```

## Docker Configuration

### Environment Variables
```bash
# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
```

### Docker Compose
```yaml
services:
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: username
      POSTGRES_PASSWORD: password
      POSTGRES_DB: database_name
    ports:
      - "5432:5432"
```

## Testing

### Test the API
1. Start the Docker containers: `docker-compose up -d`
2. Run database migrations: `npm run db:migrate`
3. Start the server: `npm run dev`
4. Use the provided HTML example file to test all endpoints
5. Monitor Redis and PostgreSQL for data persistence

### Manual Testing with curl
```bash
# Get profile (requires JWT token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/profile/profile

# Update profile
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"bio":"New bio","profilePhoto":"https://example.com/photo.jpg"}' \
     http://localhost:3000/api/profile/profile

# Set online status
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/profile/status/online

# Get online users (public)
curl http://localhost:3000/api/profile/online-users
```

## Security Considerations

1. **JWT Token Validation:** All protected endpoints validate JWT tokens
2. **Input Validation:** Bio and profile photo inputs are validated
3. **Redis TTL:** Automatic expiration prevents memory leaks
4. **CORS Configuration:** Properly configured for frontend integration
5. **Rate Limiting:** Consider implementing rate limiting for production

## Performance Considerations

1. **Redis TTL:** Efficient cleanup of expired statuses
2. **Database Indexing:** Ensure proper indexes on user fields
3. **Connection Pooling:** Prisma handles database connection pooling
4. **Caching:** Redis provides fast access to online status data

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check if Redis container is running
   - Verify Redis host/port configuration
   - Check firewall settings

2. **Database Connection Failed**
   - Verify PostgreSQL container is running
   - Check DATABASE_URL environment variable
   - Ensure database exists and is accessible

3. **JWT Token Invalid**
   - Check JWT_SECRET environment variable
   - Verify token format and expiration
   - Ensure proper Authorization header format

4. **Profile Update Fails**
   - Check if user exists in database
   - Verify required fields are provided
   - Check database constraints and validation

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify environment variable configuration
3. Test Redis and PostgreSQL connectivity
4. Review JWT token validity and format
