#!/usr/bin/env node

/**
 * Test Authentication Module
 * Run: node tests/test-auth.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/v1';
let accessToken = '';
let refreshToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'green');
  } catch (error) {
    log(`✗ ${name}`, 'red');
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Data:', error.response.data);
    } else {
      console.log('  Error:', error.message);
    }
  }
}

async function runTests() {
  log('\n=== Testing Authentication Module ===\n', 'blue');

  // Test 1: Register
  await test('Register new user', async () => {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'Test@123456',
      firstName: 'Test',
      lastName: 'User',
    });

    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
    } else {
      throw new Error('No tokens returned');
    }
  });

  // Test 2: Login
  await test('Login with credentials', async () => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@digitalsignature.com',
      password: 'Admin@123456',
    });

    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
    } else {
      throw new Error('No tokens returned');
    }
  });

  // Test 3: Get Current User
  await test('Get current user (protected)', async () => {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.data.success || !response.data.data.email) {
      throw new Error('Invalid user data');
    }
  });

  // Test 4: Refresh Token
  await test('Refresh access token', async () => {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
    } else {
      throw new Error('Token refresh failed');
    }
  });

  // Test 5: Forgot Password
  await test('Request password reset', async () => {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'admin@digitalsignature.com',
    });

    if (!response.data.success) {
      throw new Error('Forgot password failed');
    }
  });

  // Test 6: Invalid Login
  await test('Login with wrong password (should fail)', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@digitalsignature.com',
        password: 'WrongPassword123',
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected failure
        return;
      }
      throw error;
    }
  });

  // Test 7: Access Protected Route Without Token
  await test('Access protected route without token (should fail)', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected failure
        return;
      }
      throw error;
    }
  });

  // Test 8: Validation Error
  await test('Register with invalid email (should fail)', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'invalid-email',
        password: 'Test@123456',
        firstName: 'Test',
        lastName: 'User',
      });
      throw new Error('Should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Expected validation failure
        return;
      }
      throw error;
    }
  });

  // Test 9: Logout
  await test('Logout user', async () => {
    const response = await axios.post(
      `${BASE_URL}/auth/logout`,
      { refreshToken },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.data.success) {
      throw new Error('Logout failed');
    }
  });

  log('\n=== All Tests Completed ===\n', 'blue');
}

// Check if server is running
axios
  .get('http://localhost:5001/health')
  .then(() => {
    log('Server is running!', 'green');
    runTests();
  })
  .catch(() => {
    log('Server is not running! Start it with: npm run dev', 'red');
    process.exit(1);
  });
