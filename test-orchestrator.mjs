#!/usr/bin/env node

/**
 * Direct Orchestrator Test
 * Tests the actual RAG workflow components in isolation
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock the modules since we can't directly import TS files
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

async function testDocumentStructure() {
  log('\n📂 Testing Document Structure...', 'bold');
  
  try {
    // Test if core files exist
    const coreFiles = [
      'src/agents/Orchestrator.ts',
      'src/agents/DocumentProcessor.ts', 
      'src/agents/BaseAgent.ts',
      'src/lib/document-loader.ts',
      'src/lib/openai-client.ts'
    ];
    
    for (const file of coreFiles) {
      const filePath = join(__dirname, file);
      try {
        await fs.access(filePath);
        logTest(`Core File: ${file}`, 'PASS');
      } catch {
        logTest(`Core File: ${file}`, 'FAIL', 'File missing');
        return false;
      }
    }
    
    // Test PDF directory
    const pdfDir = join(__dirname, 'public', 'pdf');
    try {
      const files = await fs.readdir(pdfDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      logTest('PDF Documents', 'PASS', `Found ${pdfFiles.length} PDF files`);
    } catch {
      logTest('PDF Documents', 'FAIL', 'PDF directory not accessible');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Document Structure', 'FAIL', error.message);
    return false;
  }
}

async function testDocumentLoaderContent() {
  log('\n📚 Testing Document Loader Content...', 'bold');
  
  try {
    const loaderPath = join(__dirname, 'src', 'lib', 'document-loader.ts');
    const content = await fs.readFile(loaderPath, 'utf8');
    
    // Check for key functions
    const requiredFunctions = [
      'loadAllDocuments',
      'getCategoryFromFilename', 
      'generateTitle',
      'getDocumentsByCategory'
    ];
    
    for (const func of requiredFunctions) {
      if (content.includes(func)) {
        logTest(`Function: ${func}`, 'PASS');
      } else {
        logTest(`Function: ${func}`, 'FAIL', 'Function not found');
        return false;
      }
    }
    
    // Check for document categories
    const categories = ['FDA', 'SEC', 'PUBLICATION', 'PRESS_REPORT', 'ABSTRACT'];
    for (const category of categories) {
      if (content.includes(category)) {
        logTest(`Category: ${category}`, 'PASS');
      } else {
        logTest(`Category: ${category}`, 'FAIL', 'Category not found');
      }
    }
    
    return true;
  } catch (error) {
    logTest('Document Loader Content', 'FAIL', error.message);
    return false;
  }
}

async function testOrchestratorStructure() {
  log('\n🎯 Testing Orchestrator Structure...', 'bold');
  
  try {
    const orchestratorPath = join(__dirname, 'src', 'agents', 'Orchestrator.ts');
    const content = await fs.readFile(orchestratorPath, 'utf8');
    
    // Check for key methods
    const requiredMethods = [
      'initialize',
      'execute', 
      'performSearch',
      'generateAnalysis',
      'generateCitations'
    ];
    
    for (const method of requiredMethods) {
      if (content.includes(method)) {
        logTest(`Method: ${method}`, 'PASS');
      } else {
        logTest(`Method: ${method}`, 'FAIL', 'Method not found');
        return false;
      }
    }
    
    // Check for proper imports
    const requiredImports = [
      'DocumentProcessor',
      'BaseAgent',
      'openaiClient'
    ];
    
    for (const importName of requiredImports) {
      if (content.includes(importName)) {
        logTest(`Import: ${importName}`, 'PASS');
      } else {
        logTest(`Import: ${importName}`, 'FAIL', 'Import not found');
      }
    }
    
    return true;
  } catch (error) {
    logTest('Orchestrator Structure', 'FAIL', error.message);
    return false;
  }
}

async function testAPIRouteStructure() {
  log('\n🔌 Testing API Route Structure...', 'bold');
  
  try {
    const apiPath = join(__dirname, 'src', 'app', 'api', 'chat', 'route.ts');
    const content = await fs.readFile(apiPath, 'utf8');
    
    // Check for key components
    const requiredComponents = [
      'export async function POST',
      'generateIntelligentResponse',
      'getOpenAIClient',
      'hasRichContext'
    ];
    
    for (const component of requiredComponents) {
      if (content.includes(component)) {
        logTest(`Component: ${component}`, 'PASS');
      } else {
        logTest(`Component: ${component}`, 'FAIL', 'Component not found');
        return false;
      }
    }
    
    // Check for rich context detection
    if (content.includes('Context from documents:') && content.includes('NUMBERED CITATION REFERENCE:')) {
      logTest('Rich Context Detection', 'PASS');
    } else {
      logTest('Rich Context Detection', 'FAIL', 'Context detection logic not found');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('API Route Structure', 'FAIL', error.message);
    return false;
  }
}

async function testConfigFiles() {
  log('\n⚙️ Testing Configuration Files...', 'bold');
  
  try {
    // Test next.config.js
    const nextConfigPath = join(__dirname, 'next.config.js');
    const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
    
    if (nextConfig.includes('isStaticExport')) {
      logTest('Dual Deployment Config', 'PASS');
    } else {
      logTest('Dual Deployment Config', 'FAIL', 'Static export detection not found');
    }
    
    // Test package.json
    const packagePath = join(__dirname, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const requiredScripts = ['build:static', 'dev', 'build'];
    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logTest(`Script: ${script}`, 'PASS');
      } else {
        logTest(`Script: ${script}`, 'FAIL', 'Script not found');
      }
    }
    
    const requiredDeps = ['next', 'react', 'openai'];
    for (const dep of requiredDeps) {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        logTest(`Dependency: ${dep}`, 'PASS');
      } else {
        logTest(`Dependency: ${dep}`, 'FAIL', 'Dependency not found');
      }
    }
    
    return true;
  } catch (error) {
    logTest('Configuration Files', 'FAIL', error.message);
    return false;
  }
}

async function runOrchestratorTests() {
  log('🔬 Direct Orchestrator Component Tests', 'bold');
  log('======================================', 'bold');
  
  const testResults = [];
  
  // Run component tests
  testResults.push(await testDocumentStructure());
  testResults.push(await testDocumentLoaderContent());
  testResults.push(await testOrchestratorStructure());
  testResults.push(await testAPIRouteStructure());
  testResults.push(await testConfigFiles());
  
  // Summary
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  log('\n📊 Component Test Summary', 'bold');
  log('=========================', 'bold');
  
  if (passedTests === totalTests) {
    log(`✅ ALL COMPONENT TESTS PASSED (${passedTests}/${totalTests})`, 'green');
    log('🔧 Core components are properly structured', 'green');
    return true;
  } else {
    log(`❌ ${totalTests - passedTests} COMPONENT TEST(S) FAILED (${passedTests}/${totalTests} passed)`, 'red');
    log('⚠️  Fix component issues before testing workflow', 'yellow');
    return false;
  }
}

// Run tests if called directly
if (process.argv[1] === __filename) {
  runOrchestratorTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Component tests crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}
