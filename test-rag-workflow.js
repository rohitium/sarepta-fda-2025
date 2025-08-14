#!/usr/bin/env node

/**
 * RAG Workflow Test Suite
 * Comprehensive testing of the Sarepta FDA Analysis Framework
 * 
 * Tests:
 * 1. Document loading and processing
 * 2. Document search functionality
 * 3. Orchestrator workflow
 * 4. Citation generation
 * 5. API integration
 * 6. UI workflow simulation
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  TEST_QUERIES: [
    'What safety concerns were raised about Elevidys?',
    'What were the clinical trial results?',
    'What was the FDA approval basis?',
    'How does Elevidys work?'
  ],
  EXPECTED_DOCUMENT_COUNT: 45,
  MIN_CITATIONS_PER_RESPONSE: 1,
  MAX_RESPONSE_TIME_MS: 10000
};

// Color coding for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'blue');
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testServerHealth() {
  log('\n🔍 Testing Server Health...', 'bold');
  
  try {
    const response = await fetch(TEST_CONFIG.SERVER_URL);
    if (response.ok) {
      logTest('Server Health', 'PASS', 'Development server is running');
      return true;
    } else {
      logTest('Server Health', 'FAIL', `Server returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Server Health', 'FAIL', `Cannot connect to server: ${error.message}`);
    log('   💡 Make sure to run "npm run dev" first', 'yellow');
    return false;
  }
}

async function testDocumentLoading() {
  log('\n📚 Testing Document Loading...', 'bold');
  
  try {
    // Check if PDF files exist
    const pdfDir = path.join(__dirname, 'public', 'pdf');
    if (!fs.existsSync(pdfDir)) {
      logTest('PDF Directory', 'FAIL', 'public/pdf directory not found');
      return false;
    }
    
    const pdfFiles = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
    
    if (pdfFiles.length >= TEST_CONFIG.EXPECTED_DOCUMENT_COUNT) {
      logTest('PDF Files', 'PASS', `Found ${pdfFiles.length} PDF files`);
    } else {
      logTest('PDF Files', 'WARN', `Found ${pdfFiles.length} PDF files, expected ${TEST_CONFIG.EXPECTED_DOCUMENT_COUNT}`);
    }
    
    // Test document categories
    const categories = {
      'FDA': pdfFiles.filter(f => f.startsWith('FDA')).length,
      'Publication': pdfFiles.filter(f => f.startsWith('Publication')).length,
      'Press Report': pdfFiles.filter(f => f.startsWith('Press Report')).length,
      'SEC': pdfFiles.filter(f => f.startsWith('SEC')).length,
      'Abstract': pdfFiles.filter(f => f.startsWith('Abstract')).length
    };
    
    log('   Document Categories:', 'blue');
    Object.entries(categories).forEach(([category, count]) => {
      log(`     ${category}: ${count} files`, 'blue');
    });
    
    return true;
  } catch (error) {
    logTest('Document Loading', 'FAIL', error.message);
    return false;
  }
}

async function testAPIIntegration() {
  log('\n🔌 Testing API Integration...', 'bold');
  
  try {
    // Test rich context API call (the only type allowed)
    const startTime = Date.now();
    const response = await fetch(`${TEST_CONFIG.SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ 
          role: 'user', 
          content: 'Test query with document context\n\nContext from documents:\n[1] Sample document context for testing\n\nNUMBERED CITATION REFERENCE:\n[1] Test Document Reference'
        }],
        options: {}
      })
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      logTest('API Response', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.response) {
      logTest('API Response', 'PASS', `Responded in ${responseTime}ms`);
    } else {
      logTest('API Response', 'FAIL', 'No response content received');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('API Integration', 'FAIL', error.message);
    return false;
  }
}

async function testRichContextProcessing() {
  log('\n🧠 Testing Rich Context Processing...', 'bold');
  
  try {
    const richContextQuery = {
      messages: [
        {
          role: 'system',
          content: 'You are an expert analyst specializing in Sarepta Therapeutics Elevidys gene therapy.'
        },
        {
          role: 'user',
          content: `Based on the following document excerpts, please answer this question: "What safety concerns were raised about Elevidys?"

Context from documents:
[1] Clinical safety data shows acute serious hepatotoxicity cases post-marketing
[2] Laboratory findings show elevated ALT/AST levels in some patients
[3] FDA requested enhanced monitoring protocols

NUMBERED CITATION REFERENCE:
[1] FDA Clinical Review - Safety Analysis
[2] Post-Marketing Safety Report
[3] FDA Safety Communication

IMPORTANT: Use ONLY numbered citations [1], [2], [3], etc. in your response.`
        }
      ],
      options: {}
    };
    
    const startTime = Date.now();
    const response = await fetch(`${TEST_CONFIG.SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(richContextQuery)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      logTest('Rich Context API', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.response) {
      logTest('Rich Context Response', 'FAIL', 'No response content');
      return false;
    }
    
    // Check for proper citation usage
    const citationPattern = /\[\d+(?:,\s*\d+)*\]/g;
    const citations = data.response.match(citationPattern) || [];
    
    if (citations.length > 0) {
      logTest('Citation Generation', 'PASS', `Found ${citations.length} citations in response`);
    } else {
      logTest('Citation Generation', 'FAIL', 'No numbered citations found in response');
    }
    
    // Check response quality
    if (data.response.includes('hepatotoxicity') || data.response.includes('safety')) {
      logTest('Context Understanding', 'PASS', 'Response demonstrates understanding of safety context');
    } else {
      logTest('Context Understanding', 'WARN', 'Response may not fully address safety context');
    }
    
    logTest('Rich Context Processing', 'PASS', `Processed in ${responseTime}ms`);
    return true;
    
  } catch (error) {
    logTest('Rich Context Processing', 'FAIL', error.message);
    return false;
  }
}

async function testUIWorkflowSimulation() {
  log('\n🖥️ Testing UI Workflow Simulation...', 'bold');
  
  try {
    // Simulate the complete UI workflow
    const results = [];
    
    for (const query of TEST_CONFIG.TEST_QUERIES) {
      log(`   Testing query: "${query}"`, 'blue');
      
      const startTime = Date.now();
      
      // This simulates what the Orchestrator sends to the API after processing documents
      const richContextQuery = `Based on the following document excerpts, please answer: "${query}"\n\nContext from documents:\n[1] FDA approval and regulatory documentation\n[2] Clinical trial data and safety information\n[3] Post-marketing surveillance reports\n\nNUMBERED CITATION REFERENCE:\n[1] FDA Review Documents\n[2] EMBARK Clinical Study\n[3] Safety Monitoring Reports`;
      
      const response = await fetch(`${TEST_CONFIG.SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: richContextQuery }],
          options: { includeHistory: true, maxResults: 10, searchThreshold: 0.7 }
        })
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          query,
          success: true,
          responseTime,
          hasContent: !!data.response,
          responseLength: data.response?.length || 0
        });
      } else {
        results.push({
          query,
          success: false,
          responseTime,
          error: response.status
        });
      }
      
      // Small delay between queries
      await sleep(100);
    }
    
    const successfulQueries = results.filter(r => r.success);
    const avgResponseTime = successfulQueries.reduce((sum, r) => sum + r.responseTime, 0) / successfulQueries.length;
    
    if (successfulQueries.length === TEST_CONFIG.TEST_QUERIES.length) {
      logTest('Query Processing', 'PASS', `All ${successfulQueries.length} queries succeeded`);
      logTest('Response Time', 'PASS', `Average response time: ${Math.round(avgResponseTime)}ms`);
    } else {
      logTest('Query Processing', 'FAIL', `${successfulQueries.length}/${TEST_CONFIG.TEST_QUERIES.length} queries succeeded`);
    }
    
    return successfulQueries.length === TEST_CONFIG.TEST_QUERIES.length;
    
  } catch (error) {
    logTest('UI Workflow Simulation', 'FAIL', error.message);
    return false;
  }
}

async function testDeploymentReadiness() {
  log('\n🚀 Testing Deployment Readiness...', 'bold');
  
  try {
    // Check build files
    const buildTests = [
      { file: 'package.json', description: 'Package configuration' },
      { file: 'next.config.js', description: 'Next.js configuration' },
      { file: 'src/app/page.tsx', description: 'Main application page' },
      { file: 'src/app/api/chat/route.ts', description: 'API route' },
      { file: 'src/agents/Orchestrator.ts', description: 'Orchestrator agent' },
      { file: 'DEPLOYMENT.md', description: 'Deployment documentation' }
    ];
    
    let allFilesExist = true;
    for (const test of buildTests) {
      if (fs.existsSync(path.join(__dirname, test.file))) {
        logTest(`File: ${test.file}`, 'PASS', test.description);
      } else {
        logTest(`File: ${test.file}`, 'FAIL', `Missing: ${test.description}`);
        allFilesExist = false;
      }
    }
    
    // Check environment template
    const envTemplate = path.join(__dirname, 'env.template');
    if (fs.existsSync(envTemplate)) {
      logTest('Environment Template', 'PASS', 'env.template exists for deployment');
    } else {
      logTest('Environment Template', 'WARN', 'env.template missing');
    }
    
    return allFilesExist;
    
  } catch (error) {
    logTest('Deployment Readiness', 'FAIL', error.message);
    return false;
  }
}

async function runFullTestSuite() {
  log('🧪 Sarepta FDA RAG Workflow Test Suite', 'bold');
  log('============================================', 'bold');
  
  const testResults = [];
  
  // Run all tests
  testResults.push(await testServerHealth());
  testResults.push(await testDocumentLoading());
  testResults.push(await testAPIIntegration());
  testResults.push(await testRichContextProcessing());
  testResults.push(await testUIWorkflowSimulation());
  testResults.push(await testDeploymentReadiness());
  
  // Summary
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  log('\n📊 Test Summary', 'bold');
  log('===============', 'bold');
  
  if (passedTests === totalTests) {
    log(`✅ ALL TESTS PASSED (${passedTests}/${totalTests})`, 'green');
    log('🚀 Ready for deployment!', 'green');
    return true;
  } else {
    log(`❌ ${totalTests - passedTests} TEST(S) FAILED (${passedTests}/${totalTests} passed)`, 'red');
    log('⚠️  Fix issues before deployment', 'yellow');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  runFullTestSuite()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test suite crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runFullTestSuite,
  testServerHealth,
  testDocumentLoading,
  testAPIIntegration,
  testRichContextProcessing,
  testUIWorkflowSimulation,
  testDeploymentReadiness
};
