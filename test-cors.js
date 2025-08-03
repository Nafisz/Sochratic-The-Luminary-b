#!/usr/bin/env node

/**
 * Script untuk testing CORS configuration
 * Menjalankan berbagai request dari origin yang berbeda
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TEST_ENDPOINTS = [
  '/',
  '/api/topic',
  '/api/auth/login'
];

const TEST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:4200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

async function testEndpoint(endpoint, origin) {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on error status
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };

    return {
      success: true,
      status: response.status,
      corsHeaders,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testCorsConfiguration() {
  console.log('🔍 Testing CORS Configuration...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`📡 Testing endpoint: ${endpoint}`);
    console.log('─'.repeat(50));

    for (const origin of TEST_ORIGINS) {
      const result = await testEndpoint(endpoint, origin);
      
      if (result.success) {
        const status = result.status === 200 ? '✅' : '⚠️';
        const corsOrigin = result.corsHeaders['Access-Control-Allow-Origin'];
        const corsStatus = corsOrigin === origin || corsOrigin === '*' ? '✅' : '❌';
        
        console.log(`${status} ${origin} -> Status: ${result.status}, CORS: ${corsStatus}`);
        
        if (corsOrigin) {
          console.log(`   CORS Origin: ${corsOrigin}`);
        }
      } else {
        console.log(`❌ ${origin} -> Error: ${result.error}`);
      }
    }
    
    console.log('\n');
  }

  console.log('🎯 CORS Test Summary:');
  console.log('✅ = Success');
  console.log('⚠️ = Success but non-200 status');
  console.log('❌ = Failed');
}

// Test preflight requests
async function testPreflightRequests() {
  console.log('🛫 Testing Preflight Requests...\n');

  const preflightEndpoints = [
    '/api/auth/login',
    '/api/chat/send',
    '/api/session/create'
  ];

  for (const endpoint of preflightEndpoints) {
    console.log(`📡 Testing OPTIONS: ${endpoint}`);
    
    try {
      const response = await axios.options(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        validateStatus: () => true
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
      };

      console.log(`   Status: ${response.status}`);
      console.log(`   CORS Headers:`, corsHeaders);
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
}

// Main execution
async function main() {
  try {
    await testCorsConfiguration();
    await testPreflightRequests();
    
    console.log('🎉 CORS testing completed!');
    console.log('\n💡 Tips:');
    console.log('- Jika ada ❌, periksa konfigurasi CORS di backend');
    console.log('- Pastikan backend berjalan di port 3000');
    console.log('- Periksa firewall atau antivirus yang mungkin memblokir request');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testCorsConfiguration, testPreflightRequests }; 