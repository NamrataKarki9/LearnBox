/**
 * Resource Management API Test Script
 * Use this to verify the resource management implementation
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';

// Replace these with actual tokens from your system
const ADMIN_TOKEN = 'your_admin_jwt_token_here';
const STUDENT_TOKEN = 'your_student_jwt_token_here';

/**
 * Test 1: Upload Resource (Admin)
 */
async function testUploadResource() {
    console.log('\n📤 TEST 1: Upload Resource (Admin)');
    console.log('═══════════════════════════════════════');
    
    try {
        // Create a test PDF file if it doesn't exist
        const testFilePath = './test-resource.pdf';
        if (!fs.existsSync(testFilePath)) {
            console.log('⚠️  Test PDF file not found at:', testFilePath);
            console.log('   Please create a test PDF file or update the path');
            return;
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('title', 'Test Resource - Data Structures');
        formData.append('description', 'Complete notes for Data Structures module');
        formData.append('year', '2');
        formData.append('moduleId', '1');

        const response = await axios.post(
            `${BASE_URL}/resources/upload`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                }
            }
        );

        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

/**
 * Test 2: Filter Resources (Student)
 */
async function testFilterResources() {
    console.log('\n🔍 TEST 2: Filter Resources (Student)');
    console.log('═══════════════════════════════════════');
    
    try {
        const response = await axios.get(
            `${BASE_URL}/resources/filter`,
            {
                params: {
                    year: 2,
                    // Add more filters as needed
                },
                headers: {
                    'Authorization': `Bearer ${STUDENT_TOKEN}`
                }
            }
        );

        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Count:', response.data.count);
        console.log('Filters:', response.data.filters);
        console.log('Resources:', JSON.stringify(response.data.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

/**
 * Test 3: Get All Resources
 */
async function testGetAllResources() {
    console.log('\n📋 TEST 3: Get All Resources');
    console.log('═══════════════════════════════════════');
    
    try {
        const response = await axios.get(
            `${BASE_URL}/resources`,
            {
                headers: {
                    'Authorization': `Bearer ${STUDENT_TOKEN}`
                }
            }
        );

        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('Count:', response.data.count);
        console.log('Resources:', JSON.stringify(response.data.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

/**
 * Test 4: Student Cannot Upload (Should Fail)
 */
async function testStudentUploadDenied() {
    console.log('\n🚫 TEST 4: Student Upload Denied (Expected to Fail)');
    console.log('═══════════════════════════════════════');
    
    try {
        const testFilePath = './test-resource.pdf';
        if (!fs.existsSync(testFilePath)) {
            console.log('⚠️  Test PDF file not found');
            return;
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('title', 'Unauthorized Upload Attempt');

        const response = await axios.post(
            `${BASE_URL}/resources/upload`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${STUDENT_TOKEN}`
                }
            }
        );

        console.log('❌ Test Failed: Student should not be able to upload!');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Success! Student upload correctly denied');
            console.log('Error:', error.response.data.error);
        } else {
            console.error('❌ Unexpected Error:', error.response?.data || error.message);
        }
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  RESOURCE MANAGEMENT API TEST SUITE        ║');
    console.log('╚════════════════════════════════════════════╝');
    
    console.log('\n⚠️  BEFORE RUNNING TESTS:');
    console.log('1. Update ADMIN_TOKEN and STUDENT_TOKEN in this file');
    console.log('2. Ensure server is running on port 5000');
    console.log('3. Create a test PDF file: ./test-resource.pdf');
    console.log('4. Run: node test-resources.js\n');

    await testUploadResource();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFilterResources();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testGetAllResources();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testStudentUploadDenied();

    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  TESTS COMPLETED                           ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n');
}

// Run tests
runAllTests();
