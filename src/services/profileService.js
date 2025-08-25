const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

class ProfileService {
  // Update user bio and profile photo
  async updateProfile(userId, { bio, profilePhoto }) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          bio: bio || undefined,
          profilePhoto: profilePhoto || undefined,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          age: true,
          bio: true,
          profilePhoto: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          age: true,
          bio: true,
          profilePhoto: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get online status from Redis
      const isOnline = await this.getOnlineStatus(userId);

      return {
        success: true,
        data: {
          ...user,
          isOnline,
        },
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error('Failed to get profile');
    }
  }

  // Set user online status
  async setOnlineStatus(userId, isOnline = true) {
    try {
      const statusKey = `user:${userId}:status`;
      const userListKey = 'online_users';
      
      if (isOnline) {
        // Set user as online with timestamp
        await redis.setex(statusKey, 300, JSON.stringify({
          status: 'online',
          lastSeen: new Date().toISOString(),
        }));
        
        // Add to online users list
        await redis.sadd(userListKey, userId.toString());
        
        // Set expiry for online users list (cleanup after 5 minutes)
        await redis.expire(userListKey, 300);
      } else {
        // Set user as offline
        await redis.setex(statusKey, 86400, JSON.stringify({
          status: 'offline',
          lastSeen: new Date().toISOString(),
        }));
        
        // Remove from online users list
        await redis.srem(userListKey, userId.toString());
      }

      return {
        success: true,
        message: `User ${isOnline ? 'online' : 'offline'}`,
      };
    } catch (error) {
      console.error('Error setting online status:', error);
      throw new Error('Failed to set online status');
    }
  }

  // Get user online status
  async getOnlineStatus(userId) {
    try {
      const statusKey = `user:${userId}:status`;
      const status = await redis.get(statusKey);
      
      if (!status) {
        return false;
      }

      const statusData = JSON.parse(status);
      return statusData.status === 'online';
    } catch (error) {
      console.error('Error getting online status:', error);
      return false;
    }
  }

  // Get all online users
  async getOnlineUsers() {
    try {
      const userListKey = 'online_users';
      const onlineUserIds = await redis.smembers(userListKey);
      
      if (onlineUserIds.length === 0) {
        return [];
      }

      // Get user details for online users
      const onlineUsers = await prisma.user.findMany({
        where: {
          id: {
            in: onlineUserIds.map(id => parseInt(id)),
          },
        },
        select: {
          id: true,
          name: true,
          username: true,
          profilePhoto: true,
        },
      });

      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Update last seen timestamp
  async updateLastSeen(userId) {
    try {
      const statusKey = `user:${userId}:status`;
      const currentStatus = await redis.get(statusKey);
      
      if (currentStatus) {
        const statusData = JSON.parse(currentStatus);
        if (statusData.status === 'online') {
          // Update last seen for online users
          await redis.setex(statusKey, 300, JSON.stringify({
            ...statusData,
            lastSeen: new Date().toISOString(),
          }));
        }
      }
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  }

  // Cleanup expired online statuses
  async cleanupExpiredStatuses() {
    try {
      const userListKey = 'online_users';
      const onlineUserIds = await redis.smembers(userListKey);
      
      for (const userId of onlineUserIds) {
        const statusKey = `user:${userId}:status`;
        const status = await redis.get(statusKey);
        
        if (!status) {
          // Remove from online users if status doesn't exist
          await redis.srem(userListKey, userId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired statuses:', error);
    }
  }

  // Get user status with last seen
  async getUserStatus(userId) {
    try {
      const statusKey = `user:${userId}:status`;
      const status = await redis.get(statusKey);
      
      if (!status) {
        return {
          status: 'offline',
          lastSeen: null,
        };
      }

      return JSON.parse(status);
    } catch (error) {
      console.error('Error getting user status:', error);
      return {
        status: 'offline',
        lastSeen: null,
      };
    }
  }

  // Heartbeat to keep user online
  async heartbeat(userId) {
    try {
      await this.updateLastSeen(userId);
      return { success: true, message: 'Heartbeat received' };
    } catch (error) {
      console.error('Error processing heartbeat:', error);
      throw new Error('Failed to process heartbeat');
    }
  }
}

module.exports = ProfileService;