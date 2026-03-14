/**
 * Test script to debug profile update endpoint
 * Run with: node backend/test-profile-update.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testEmail = 'student1@college.com';
const testPassword = 'Test@1234';

async function testProfileUpdate() {
  try {
    console.log('\n=== Testing Profile Update ===\n');

    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    if (!loginResponse.data.access) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.access;
    const user = loginResponse.data.user;
    console.log('✓ Login successful');
    console.log('  User:', user.username, '(ID:', user.id, ')');

    // Step 2: Try to update profile
    console.log('\nStep 2: Updating profile...');
    
    const updateData = {
      first_name: 'TestStudent',
      last_name: 'Update',
      username: user.username, // Keep same to avoid duplicate
      email: user.email, // Keep same to avoid duplicate
      phone: '+977-1234567890',
      bio: 'Testing profile update'
    };

    console.log('  Sending data:', updateData);

    const updateResponse = await axios.put(
      `${BASE_URL}/auth/profile`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Profile update successful');
    console.log('  Response:', updateResponse.data);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response data:', error.response.data);
    }
    
    if (error.code) {
      console.error('  Error code:', error.code);
    }
  }
}

// Run the test
testProfileUpdate().catch(console.error);
