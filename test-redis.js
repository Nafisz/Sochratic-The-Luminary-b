const Redis = require('ioredis');

// Redis connection configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

async function testRedis() {
  try {
    console.log('🔌 Testing Redis connection...');
    
    // Test basic connection
    await redis.ping();
    console.log('✅ Redis connection successful');
    
    // Test basic operations
    console.log('\n🧪 Testing basic Redis operations...');
    
    // Set a test key
    await redis.set('test:key', 'Hello Redis!');
    console.log('✅ Set key successful');
    
    // Get the test key
    const value = await redis.get('test:key');
    console.log('✅ Get key successful:', value);
    
    // Test TTL (Time To Live)
    await redis.setex('test:ttl', 10, 'This will expire in 10 seconds');
    console.log('✅ Set key with TTL successful');
    
    // Get TTL
    const ttl = await redis.ttl('test:ttl');
    console.log('✅ TTL check successful:', ttl, 'seconds remaining');
    
    // Test user status simulation
    console.log('\n👤 Testing user status simulation...');
    
    const userId = 123;
    const statusKey = `user:${userId}:status`;
    const userListKey = 'online_users';
    
    // Set user online
    await redis.setex(statusKey, 300, JSON.stringify({
      status: 'online',
      lastSeen: new Date().toISOString(),
    }));
    console.log('✅ Set user online status successful');
    
    // Add to online users list
    await redis.sadd(userListKey, userId.toString());
    console.log('✅ Add user to online list successful');
    
    // Get user status
    const userStatus = await redis.get(statusKey);
    console.log('✅ Get user status successful:', userStatus);
    
    // Get online users count
    const onlineCount = await redis.scard(userListKey);
    console.log('✅ Get online users count successful:', onlineCount);
    
    // Get all online users
    const onlineUsers = await redis.smembers(userListKey);
    console.log('✅ Get online users list successful:', onlineUsers);
    
    // Test cleanup
    console.log('\n🧹 Testing cleanup...');
    
    // Remove test keys
    await redis.del('test:key', 'test:ttl', statusKey);
    await redis.del(userListKey);
    console.log('✅ Cleanup successful');
    
    console.log('\n🎉 All Redis tests passed!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close Redis connection
    await redis.quit();
    console.log('\n🔌 Redis connection closed');
  }
}

// Run the test
testRedis();
