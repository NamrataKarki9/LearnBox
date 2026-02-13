/*
 =========================================
 PRODUCTION TEST SCRIPT
 =========================================
 Tests all components of the semantic search system
 Run this after vectorization to verify everything works
*/

import './src/config.js';
import { connectDatabase } from './src/prisma.js';
import { PrismaClient } from '@prisma/client';
import { getVectraIndex } from './src/config/chroma.config.js';
import { semanticSearch } from './src/services/search.service.js';

const prisma = new PrismaClient();

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testDatabase() {
    log('\n📊 Testing Database Connection...', 'cyan');
    try {
        const resourceCount = await prisma.resource.count();
        log(`✅ Database connected! Found ${resourceCount} resources`, 'green');
        return true;
    } catch (error) {
        log(`❌ Database error: ${error.message}`, 'red');
        return false;
    }
}

async function testVectorIndex() {
    log('\n📦 Testing Vector Index...', 'cyan');
    try {
        const index = await getVectraIndex();
        const items = await index.listItems();
        log(`✅ Vector index loaded! Contains ${items.length} embeddings`, 'green');
        return items.length > 0;
    } catch (error) {
        log(`❌ Vector index error: ${error.message}`, 'red');
        return false;
    }
}

async function testSearch() {
    log('\n🔍 Testing Semantic Search...', 'cyan');
    
    const testQueries = [
        'machine learning algorithms',
        'neural networks',
        'data structures',
        'programming concepts'
    ];

    for (const query of testQueries) {
        try {
            log(`\n   Searching for: "${query}"`, 'yellow');
            const results = await semanticSearch(query, {}, 3);
            
            if (results.length > 0) {
                log(`   ✅ Found ${results.length} results`, 'green');
                results.forEach((result, idx) => {
                    log(`      ${idx + 1}. ${result.title} (score: ${result.relevanceScore.toFixed(2)})`, 'reset');
                });
            } else {
                log(`   ⚠️  No results found`, 'yellow');
            }
        } catch (error) {
            log(`   ❌ Search failed: ${error.message}`, 'red');
            return false;
        }
    }
    
    log('\n✅ All search tests passed!', 'green');
    return true;
}

async function runTests() {
    log('\n' + '='.repeat(50), 'bold');
    log('🧪 PRODUCTION READINESS TEST', 'bold');
    log('='.repeat(50), 'bold');

    // Connect to database
    log('\n🔌 Connecting to database...', 'cyan');
    await connectDatabase();

    const results = {
        database: false,
        vectorIndex: false,
        search: false
    };

    // Run tests
    results.database = await testDatabase();
    if (results.database) {
        results.vectorIndex = await testVectorIndex();
        if (results.vectorIndex) {
            results.search = await testSearch();
        }
    }

    // Summary
    log('\n' + '='.repeat(50), 'bold');
    log('📊 TEST SUMMARY', 'bold');
    log('='.repeat(50), 'bold');
    
    const tests = [
        { name: 'Database Connection', passed: results.database },
        { name: 'Vector Index', passed: results.vectorIndex },
        { name: 'Semantic Search', passed: results.search }
    ];

    tests.forEach(test => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        const color = test.passed ? 'green' : 'red';
        log(`${status} - ${test.name}`, color);
    });

    const allPassed = Object.values(results).every(r => r);
    
    log('\n' + '='.repeat(50), 'bold');
    if (allPassed) {
        log('🎉 ALL TESTS PASSED - PRODUCTION READY! 🚀', 'green');
        log('\nYour semantic search system is working perfectly!', 'green');
        log('You can now start the backend server with:', 'cyan');
        log('   npm run dev', 'bold');
    } else {
        log('⚠️  SOME TESTS FAILED', 'yellow');
        log('\nPlease check the errors above and:', 'yellow');
        log('1. Ensure database is running', 'reset');
        log('2. Run: node vectorize-resources.js', 'reset');
        log('3. Run this test again', 'reset');
    }
    log('='.repeat(50) + '\n', 'bold');

    // Cleanup
    await prisma.$disconnect();
    process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
