/**
 * Flare Integration Test Script
 * Tests all Flare integration endpoints and functionality
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5004';
const BACKEND_PORT = process.env.BACKEND_PORT || 5004;

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || BACKEND_PORT,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', body = null, expectedStatus = 200) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    log(`   ${method} ${path}`, 'yellow');
    
    const result = await makeRequest(path, method, body);
    
    if (result.status === expectedStatus) {
      log(`   ✅ Status: ${result.status}`, 'green');
      if (result.data.success !== undefined) {
        log(`   ✅ Success: ${result.data.success}`, 'green');
      }
      return { passed: true, result };
    } else {
      log(`   ❌ Expected status ${expectedStatus}, got ${result.status}`, 'red');
      log(`   Response: ${JSON.stringify(result.data, null, 2)}`, 'red');
      return { passed: false, result };
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    if (error.code === 'ECONNREFUSED') {
      log(`   ⚠️  Backend server is not running on ${BACKEND_URL}`, 'yellow');
      log(`   💡 Start backend with: cd backend && npm start`, 'yellow');
    }
    return { passed: false, error: error.message };
  }
}

async function runTests() {
  log('\n🔥 Flare Integration Test Suite', 'blue');
  log('='.repeat(50), 'blue');
  
  const tests = [];
  
  // Test 1: Contract Status
  tests.push(await testEndpoint(
    'Flare Contract Status',
    '/api/dao/contract-status'
  ));
  
  // Test 2: Flare Oracle Price (BTC)
  tests.push(await testEndpoint(
    'Flare Oracle Price - BTC',
    '/api/dao/flare-oracle-price/BTC'
  ));
  
  // Test 3: Flare Oracle Price (ETH)
  tests.push(await testEndpoint(
    'Flare Oracle Price - ETH',
    '/api/dao/flare-oracle-price/ETH'
  ));
  
  // Test 4: All Predictions with Flare
  tests.push(await testEndpoint(
    'All Predictions with Flare Data',
    '/api/dao/predictions/all-with-flare'
  ));
  
  // Test 5: Active Predictions with Flare
  tests.push(await testEndpoint(
    'Active Predictions with Flare Data',
    '/api/dao/predictions/active-with-flare'
  ));
  
  // Test 6: Create Flare Prediction (POST - should validate)
  tests.push(await testEndpoint(
    'Create Flare Prediction (Validation Test)',
    '/api/dao/predictions/create-with-flare',
    'POST',
    {
      title: 'Test Prediction',
      description: 'Test Description',
      category: 'Crypto',
      assetSymbol: 'BTC',
      votingPeriod: '7',
      creator: '0x1234567890123456789012345678901234567890',
      transactionHash: '0xabcdef',
      flarePredictionId: '1'
    },
    200 // Should accept or return validation error
  ));
  
  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Results Summary', 'blue');
  log('='.repeat(50), 'blue');
  
  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;
  
  tests.forEach((test, index) => {
    if (test.passed) {
      log(`✅ Test ${index + 1}: PASSED`, 'green');
    } else {
      log(`❌ Test ${index + 1}: FAILED`, 'red');
      if (test.error) {
        log(`   Error: ${test.error}`, 'red');
      }
    }
  });
  
  log('\n' + '='.repeat(50), 'blue');
  if (passed === total) {
    log(`🎉 All ${total} tests PASSED!`, 'green');
  } else {
    log(`⚠️  ${passed}/${total} tests passed`, 'yellow');
    log(`❌ ${total - passed} tests failed`, 'red');
  }
  log('='.repeat(50), 'blue');
  
  // Check if backend is running
  if (passed === 0 && tests[0]?.error?.code === 'ECONNREFUSED') {
    log('\n💡 To start the backend server:', 'yellow');
    log('   cd InvestraXFlare/backend', 'yellow');
    log('   npm install (if needed)', 'yellow');
    log('   npm start', 'yellow');
    log('\n   Then run this test again.', 'yellow');
  }
}

// Run tests
runTests().catch(console.error);

