/**
 * Test Script for Step 27: MT-02 Near-Exact Match Service Scaffold
 *
 * Verifies:
 * - MT-02 service files created
 * - Configuration correct (port 3004, Swagger)
 * - Health endpoint structure
 * - TypeScript compilation
 */

async function testStep27() {
  console.log('='.repeat(80));
  console.log('TESTING STEP 27: MT-02 Near-Exact Match Service Scaffold');
  console.log('='.repeat(80));
  console.log('');

  try {
    const fs = require('fs');
    const path = require('path');

    // Test 1: Verify Service Files Exist
    console.log('TEST 1: Verify Service Files Created');
    console.log('-'.repeat(80));

    const files = {
      'main.ts': fs.existsSync(path.join(__dirname, 'src/main.ts')),
      'controller.ts': fs.existsSync(path.join(__dirname, 'src/mt-02-near-exact.controller.ts')),
      'service.ts': fs.existsSync(path.join(__dirname, 'src/mt-02-near-exact.service.ts')),
      'module.ts': fs.existsSync(path.join(__dirname, 'src/mt-02-near-exact.module.ts')),
    };

    let allFilesExist = true;
    Object.entries(files).forEach(([file, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${file}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allFilesExist = false;
    });
    console.log('');

    const test1Pass = allFilesExist;
    console.log(test1Pass ? '✅ TEST 1 PASSED' : '❌ TEST 1 FAILED');
    console.log('');
    console.log('');

    // Test 2: Verify Main.ts Configuration
    console.log('TEST 2: Verify Main.ts Configuration');
    console.log('-'.repeat(80));

    const mainPath = path.join(__dirname, 'src/main.ts');
    const mainContent = fs.readFileSync(mainPath, 'utf-8');

    const mainConfig = {
      'Port 3004': mainContent.includes('3004'),
      'ValidationPipe': mainContent.includes('ValidationPipe'),
      'Swagger setup': mainContent.includes('SwaggerModule'),
      'Service title': mainContent.includes('MT-02 Near-Exact Match'),
      'Fuzzy description': mainContent.includes('Fuzzy matching') || mainContent.includes('fuzzy'),
      'Console log': mainContent.includes('MT-02') && mainContent.includes('console.log'),
    };

    let allConfigCorrect = true;
    Object.entries(mainConfig).forEach(([config, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${config}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allConfigCorrect = false;
    });
    console.log('');

    const test2Pass = allConfigCorrect;
    console.log(test2Pass ? '✅ TEST 2 PASSED' : '❌ TEST 2 FAILED');
    console.log('');
    console.log('');

    // Test 3: Verify Controller Health Endpoint
    console.log('TEST 3: Verify Controller Health Endpoint');
    console.log('-'.repeat(80));

    const controllerPath = path.join(__dirname, 'src/mt-02-near-exact.controller.ts');
    const controllerContent = fs.readFileSync(controllerPath, 'utf-8');

    const controller = {
      'Health endpoint': controllerContent.includes('healthCheck'),
      'GET decorator': controllerContent.includes("@Get('health')"),
      'ApiOperation': controllerContent.includes('@ApiOperation'),
      'Returns object': controllerContent.includes('return {'),
      'Service name': controllerContent.includes('mt-02-near-exact'),
      'Algorithm type': controllerContent.includes('fuzzy-match'),
      'Capabilities': controllerContent.includes('date-tolerance') && controllerContent.includes('amount-tolerance'),
    };

    let controllerCorrect = true;
    Object.entries(controller).forEach(([check, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${check}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) controllerCorrect = false;
    });
    console.log('');

    const test3Pass = controllerCorrect;
    console.log(test3Pass ? '✅ TEST 3 PASSED' : '❌ TEST 3 FAILED');
    console.log('');
    console.log('');

    // Test 4: Verify Service Scaffold
    console.log('TEST 4: Verify Service Scaffold');
    console.log('-'.repeat(80));

    const servicePath = path.join(__dirname, 'src/mt-02-near-exact.service.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');

    const service = {
      '@Injectable': serviceContent.includes('@Injectable'),
      'Service class': serviceContent.includes('export class Mt02NearExactService'),
      'Documentation': serviceContent.includes('MT-02') || serviceContent.includes('Fuzzy'),
      'Placeholder comment': serviceContent.includes('Step 28') || serviceContent.includes('implemented'),
    };

    let serviceCorrect = true;
    Object.entries(service).forEach(([check, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${check}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) serviceCorrect = false;
    });
    console.log('');

    const test4Pass = serviceCorrect;
    console.log(test4Pass ? '✅ TEST 4 PASSED' : '❌ TEST 4 FAILED');
    console.log('');
    console.log('');

    // Test 5: Verify NPM Scripts
    console.log('TEST 5: Verify NPM Scripts');
    console.log('-'.repeat(80));

    const packagePath = path.join(__dirname, '../../package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');

    const scripts = {
      'build:mt-02': packageContent.includes('"build:mt-02"'),
      'start:mt-02': packageContent.includes('"start:mt-02"'),
      'start:mt-02:dev': packageContent.includes('"start:mt-02:dev"'),
    };

    let allScriptsExist = true;
    Object.entries(scripts).forEach(([script, exists]) => {
      console.log(`  ${exists ? '✓' : '✗'} ${script}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allScriptsExist = false;
    });
    console.log('');

    const test5Pass = allScriptsExist;
    console.log(test5Pass ? '✅ TEST 5 PASSED' : '❌ TEST 5 FAILED');
    console.log('');
    console.log('');

    // Test 6: TypeScript Compilation
    console.log('TEST 6: TypeScript Compilation');
    console.log('-'.repeat(80));

    const execSync = require('child_process').execSync;
    let buildSuccess = false;

    try {
      execSync('npm run build:mt-02', { stdio: 'pipe', cwd: path.join(__dirname, '../..') });
      buildSuccess = true;
      console.log('  ✅ MT-02 service compiles successfully');
    } catch (error) {
      console.log('  ❌ Build failed - TypeScript compilation errors');
    }
    console.log('');

    const test6Pass = buildSuccess;
    console.log(test6Pass ? '✅ TEST 6 PASSED' : '❌ TEST 6 FAILED');
    console.log('');
    console.log('');

    // Final results
    console.log('='.repeat(80));
    const allTestsPassed = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass && test6Pass;

    if (allTestsPassed) {
      console.log('✅ ALL STEP 27 TESTS PASSED');
      console.log('');
      console.log('STEP 27 COMPLETE: MT-02 Near-Exact Match Service Scaffold');
      console.log('');
      console.log('SUMMARY:');
      console.log('  ✅ MT-02 NestJS application generated');
      console.log('  ✅ Port configured: 3004');
      console.log('  ✅ Swagger/OpenAPI documentation configured');
      console.log('  ✅ ValidationPipe enabled');
      console.log('  ✅ Health check endpoint: GET /match/health');
      console.log('  ✅ NPM scripts added (build:mt-02, start:mt-02, start:mt-02:dev)');
      console.log('  ✅ TypeScript compiles successfully');
      console.log('');
      console.log('SERVICE INFO:');
      console.log('  Name: MT-02 Near-Exact Match Service');
      console.log('  Port: 3004');
      console.log('  Algorithm: Fuzzy matching with tolerance');
      console.log('  Capabilities: date-tolerance, amount-tolerance, description-similarity');
      console.log('  Swagger: http://localhost:3004/api');
      console.log('');
      console.log('SERVICES ARCHITECTURE:');
      console.log('  ├─ Data Prep Service (port 3001)');
      console.log('  ├─ State Manager Service (port 3002)');
      console.log('  ├─ MT-01 Exact Match (port 3003) ✅');
      console.log('  └─ MT-02 Near-Exact Match (port 3004) ✅ NEW!');
      console.log('');
      console.log('✨ STEP 27: MT-02 SCAFFOLD - COMPLETE!');
      console.log('');
      console.log('READY FOR STEP 28: Implement Fuzzy Matching Algorithms');
      console.log('='.repeat(80));
      process.exit(0);
    } else {
      console.log('❌ SOME STEP 27 TESTS FAILED');
      console.log('='.repeat(80));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testStep27();
