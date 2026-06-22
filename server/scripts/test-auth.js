#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/v1';

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

async function testAuth() {
  let accessToken = '';
  let refreshToken = '';

  try {
    log('\n========================================', 'blue');
    log('Testing Authentication Module', 'blue');
    log('========================================\n', 'blue');

    // Test 1: Health Check
    log('1. Testing Health Check...', 'yellow');
    try {
      const health = await axios.get('http://localhost:5001/health');
      log(`✓ Health check passed: ${health.data.message}`, 'green');
    } catch (error) {
      log(`✗ Health check failed: ${error.message}`, 'red');
      throw error;
    }

    // Test 2: Register
    log('\n2. Testing User Registration...', 'yellow');
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'Test@123456',
      firstName: 'Test',
      lastName: 'User',
    };

    try {
      const registerRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
      accessToken = registerRes.data.data.accessToken;
      refreshToken = registerRes.data.data.refreshToken;
      log(`✓ Registration successful`, 'green');
      log(`  Email: ${testUser.email}`, 'green');
      log(`  User ID: ${registerRes.data.data.user.id}`, 'green');
    } catch (error) {
      log(`✗ Registration failed: ${error.response?.data?.message || error.message}`, 'red');
      throw error;
    }

    // Test 3: Get Current User
    log('\n3. Testing Get Current User (Protected)...', 'yellow');
    try {
      const meRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      log(`✓ Get current user successful`, 'green');
      log(`  Email: ${meRes.data.data.email}`, 'green');
      log(`  Role: ${meRes.data.data.role}`, 'green');
    } catch (error) {
      log(`✗ Get current user failed: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 4: Login
    log('\n4. Testing Login...', 'yellow');
    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      const newAccessToken = loginRes.data.data.accessToken;
      log(`✓ Login successful`, 'green');
      log(`  New access token generated`, 'green');
    } catch (error) {
      log(`✗ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 5: Refresh Token
    log('\n5. Testing Refresh Token...', 'yellow');
    try {
      const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: refreshToken,
      });
      accessToken = refreshRes.data.data.accessToken;
      refreshToken = refreshRes.data.data.refreshToken;
      log(`✓ Token refresh successful`, 'green');
      log(`  New tokens generated`, 'green');
    } catch (error) {
      log(`✗ Token refresh failed: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 6: Forgot Password
    log('\n6. Testing Forgot Password...', 'yellow');
    try {
      const forgotRes = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: testUser.email,
      });
      log(`✓ Forgot password successful`, 'green');
      log(`  ${forgotRes.data.message}`, 'green');
      if (forgotRes.data.data?.resetToken) {
        log(`  Reset Token (dev): ${forgotRes.data.data.resetToken}`, 'green');
      }
    } catch (error) {
      log(`✗ Forgot password failed: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 7: Change Password
    log('\n7. Testing Change Password...', 'yellow');
    try {
      const changeRes = await axios.post(
        `${BASE_URL}/auth/change-password`,
        {
          currentPassword: 'Test@123456',
          newPassword: 'NewTest@123456',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      log(`✓ Password change successful`, 'green');
      log(`  ${changeRes.data.message}`, 'green');
    } catch (error) {
      log(`✗ Password change failed: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 8: Login with Admin (Seeded)
    log('\n8. Testing Login with Admin User...', 'yellow');
    try {
      const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@digitalsignature.com',
        password: 'Admin@123456',
      });
      log(`✓ Admin login successful`, 'green');
      log(`  Role: ${adminLoginRes.data.data.user.role}`, 'green');
    } catch (error) {
      log(
        `✗ Admin login failed: ${error.response?.data?.message || error.message}`,
        'red'
      );
    }

    // Test 9: Logout
    log('\n9. Testing Logout...', 'yellow');
    try {
      const logoutRes = await axios.post(
        `${BASE_URL}/auth/logout`,
        { refreshToken },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      log(`✓ Logout successful`, 'green');
      log(`  ${logoutRes.data.message}`, 'green');
    } catch (error) {
      log(`✗ Logout failed: ${error.response?.data?.message || error.message}`, 'red');
    }

    log('\n========================================', 'blue');
    log('✓ All Authentication Tests Completed!', 'green');
    log('========================================\n', 'blue');
  } catch (error) {
    log('\n========================================', 'blue');
    log('✗ Authentication Tests Failed', 'red');
    log('========================================\n', 'blue');
    process.exit(1);
  }
}

// Run tests
testAuth();
