const { PrismaClient } = require('@prisma/client');

class ProfileService {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Get user profile by user ID
   * @param {number} userId - User ID from JWT token
   * @returns {Object} User profile data
   */
  async getUserProfile(userId) {
    try {
      const user = await this.prisma.user.findUnique({ // ✅ Gunakan this.prisma
        where: { id: userId },
        select: {
          id: true,
          name: true,
          username: true,
          age: true,
          email: true,
          createdAt: true,
          userIntelProgress: {
            select: {
              type: true,
              exp: true,
              level: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Format the profile data
      const profile = {
        id: user.id,
        name: user.name,
        username: user.username,
        age: user.age,
        email: user.email,
        createdAt: {
          month: user.createdAt.getMonth() + 1,
          year: user.createdAt.getFullYear()
        },
        intelligenceProgress: user.userIntelProgress
      };

      return profile;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID from JWT token
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      // Validate update data
      const allowedFields = ['name', 'username', 'age'];
      const filteredData = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Check if username is already taken by another user
      if (filteredData.username) {
        const existingUser = await this.prisma.user.findFirst({ // ✅ Gunakan this.prisma
          where: {
            username: filteredData.username,
            id: { not: userId }
          }
        });

        if (existingUser) {
          throw new Error('Username already taken');
        }
      }

      // Update user profile
      const updatedUser = await this.prisma.user.update({ // ✅ Gunakan this.prisma
        where: { id: userId },
        data: filteredData,
        select: {
          id: true,
          name: true,
          username: true,
          age: true,
          email: true,
          createdAt: true
        }
      });

      // Format the response
      const profile = {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        age: updatedUser.age,
        email: updatedUser.email,
        createdAt: {
          month: updatedUser.createdAt.getMonth() + 1,
          year: updatedUser.createdAt.getFullYear()
        }
      };

      return profile;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  /**
   * Get user statistics summary
   * @param {number} userId - User ID from JWT token
   * @returns {Object} User statistics
   */
  async getUserStats(userId) {
    try {
      const [sessionCount, totalExp, levelProgress] = await Promise.all([
        this.prisma.session.count({ // ✅ Gunakan this.prisma
          where: { userId, status: 'COMPLETED' }
        }),
        this.prisma.userIntelProgress.aggregate({ // ✅ Gunakan this.prisma
          where: { userId },
          _sum: { exp: true }
        }),
        this.prisma.userIntelProgress.findMany({ // ✅ Gunakan this.prisma
          where: { userId },
          select: { type: true, level: true, exp: true }
        })
      ]);

      return {
        totalSessions: sessionCount,
        totalExperience: totalExp._sum.exp || 0,
        intelligenceLevels: levelProgress
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }
}

// Export class, bukan instance
module.exports = ProfileService;