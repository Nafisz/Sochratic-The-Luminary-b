const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  email: 'jwt-test@example.com',
  username: 'jwttestuser',
  password: 'testpassword123',
  name: 'JWT Test User',
  age: 25
};

let authToken = null;
let userId = null;

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Register User
async function testRegister() {
  console.log('\n🔐 Testing Register...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Register successful');
    console.log('User ID:', response.data.user.id);
    console.log('Token received:', response.data.token ? 'Yes' : 'No');
    
    authToken = response.data.token;
    userId = response.data.user.id;
    
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists, trying login instead...');
      return await testLogin();
    }
    console.error('❌ Register failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Login User
async function testLogin() {
  console.log('\n🔑 Testing Login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful');
    console.log('Token received:', response.data.token ? 'Yes' : 'No');
    
    authToken = response.data.token;
    userId = response.data.user.id;
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Access Protected Route
async function testProtectedRoute() {
  console.log('\n🛡️  Testing Protected Route...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/protected/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Protected route accessed successfully');
    console.log('User data:', response.data.user);
    
    return true;
  } catch (error) {
    console.error('❌ Protected route access failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Test Token Verification
async function testTokenVerification() {
  console.log('\n🔍 Testing Token Verification...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Token verification successful');
    console.log('Token valid:', response.data.valid);
    
    return true;
  } catch (error) {
    console.error('❌ Token verification failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Test Optional Auth Route
async function testOptionalAuth() {
  console.log('\n🔓 Testing Optional Auth Route...');
  
  try {
    // Test without token
    const response1 = await axios.get(`${BASE_URL}/protected/public-data`);
    console.log('✅ Optional auth route without token:', response1.data);
    
    // Test with token
    if (authToken) {
      const response2 = await axios.get(`${BASE_URL}/protected/public-data`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Optional auth route with token:', response2.data);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Optional auth route failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Test Invalid Token
async function testInvalidToken() {
  console.log('\n🚫 Testing Invalid Token...');
  
  try {
    const response = await axios.get(`${BASE_URL}/protected/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token-here'
      }
    });
    
    console.log('❌ Should have failed with invalid token');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Invalid token correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error with invalid token:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 7: Test Missing Token
async function testMissingToken() {
  console.log('\n🚫 Testing Missing Token...');
  
  try {
    const response = await axios.get(`${BASE_URL}/protected/profile`);
    
    console.log('❌ Should have failed with missing token');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Missing token correctly rejected');
      return true;
    } else {
      console.error('❌ Unexpected error with missing token:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 8: Test Token Refresh
async function testTokenRefresh() {
  console.log('\n🔄 Testing Token Refresh...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      token: authToken
    });
    
    console.log('✅ Token refresh successful');
    console.log('New token received:', response.data.token ? 'Yes' : 'No');
    
    // Update token
    authToken = response.data.token;
    
    return true;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting JWT Implementation Tests...\n');
  
  const tests = [
    { name: 'Register/Login', fn: testRegister },
    { name: 'Protected Route Access', fn: testProtectedRoute },
    { name: 'Token Verification', fn: testTokenVerification },
    { name: 'Optional Auth Route', fn: testOptionalAuth },
    { name: 'Invalid Token Rejection', fn: testInvalidToken },
    { name: 'Missing Token Rejection', fn: testMissingToken },
    { name: 'Token Refresh', fn: testTokenRefresh }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
      await delay(500); // Small delay between tests
    } catch (error) {
      console.error(`❌ Test "${test.name}" crashed:`, error.message);
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! JWT implementation is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testRegister,
  testLogin,
  testProtectedRoute,
  testTokenVerification,
  testOptionalAuth,
  testInvalidToken,
  testMissingToken,
  testTokenRefresh,
  runAllTests
};

