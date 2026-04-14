/**
 * Test Script for Step 22: MT-01 Service Scaffold
 *
 * Verifies:
 * - Service created successfully
 * - Configuration files present
 * - main.ts configured with port 3003, Swagger, ValidationPipe
 * - Controller has health check endpoint
 * - Service compiles successfully
 */

async function testMt01Scaffold() {
  console.log('='.repeat(80));
  console.log('TESTING STEP 22: MT-01 Exact Match Service Scaffold');
  console.log('='.repeat(80));
  console.log('');

  try {
    const fs = require('fs');
    const path = require('path');

    // Test 1: Verify File Structure
    console.log('TEST 1: Verify File Structure');
    console.log('-'.repeat(80));

    const files = [
      'src/main.ts',
      'src/mt-01-exact-match.module.ts',
      'src/mt-01-exact-match.controller.ts',
      'src/mt-01-exact-match.service.ts',
    ];

    let allFilesExist = true;
    files.forEach(file => {
      const filePath = path.join(__dirname, file);
      const exists = fs.existsSync(filePath);
      console.log(`  ${exists ? '✓' : '✗'} ${file}: ${exists ? 'YES' : 'NO'}`);
      if (!exists) allFilesExist = false;
    });
    console.log('');

    const test1Pass = allFilesExist;
    console.log(test1Pass ? '✅ TEST 1 PASSED' : '❌ TEST 1 FAILED');
    console.log('');
    console.log('');

    // Test 2: Verify main.ts Configuration
    console.log('TEST 2: Verify main.ts Configuration');
    console.log('-'.repeat(80));

    const mainSource = fs.readFileSync('./src/main.ts', 'utf-8');

    const hasValidationPipe = mainSource.includes('ValidationPipe');
    const hasSwagger = mainSource.includes('SwaggerModule');
    const hasPort3003 = mainSource.includes('3003');
    const hasSwaggerSetup = mainSource.includes("SwaggerModule.setup('api'");
    const hasMT01Title = mainSource.includes('MT-01');

    console.log(`  ✓ ValidationPipe imported: ${hasValidationPipe ? 'YES' : 'NO'}`);
    console.log(`  ✓ SwaggerModule imported: ${hasSwagger ? 'YES' : 'NO'}`);
    console.log(`  ✓ Port 3003 configured: ${hasPort3003 ? 'YES' : 'NO'}`);
    console.log(`  ✓ Swagger setup called: ${hasSwaggerSetup ? 'YES' : 'NO'}`);
    console.log(`  ✓ MT-01 title in Swagger: ${hasMT01Title ? 'YES' : 'NO'}`);
    console.log('');

    const test2Pass = hasValidationPipe && hasSwagger && hasPort3003 && hasSwaggerSetup && hasMT01Title;
    console.log(test2Pass ? '✅ TEST 2 PASSED' : '❌ TEST 2 FAILED');
    console.log('');
    console.log('');

    // Test 3: Verify Controller Configuration
    console.log('TEST 3: Verify Controller Configuration');
    console.log('-'.repeat(80));

    const controllerSource = fs.readFileSync('./src/mt-01-exact-match.controller.ts', 'utf-8');

    const hasApiTags = controllerSource.includes('@ApiTags');
    const hasApiOperation = controllerSource.includes('@ApiOperation');
    const hasApiResponse = controllerSource.includes('@ApiResponse');
    const hasMatchRoute = controllerSource.includes("@Controller('match')");
    const hasHealthCheck = controllerSource.includes('healthCheck');

    console.log(`  ✓ @ApiTags decorator: ${hasApiTags ? 'YES' : 'NO'}`);
    console.log(`  ✓ @ApiOperation decorator: ${hasApiOperation ? 'YES' : 'NO'}`);
    console.log(`  ✓ @ApiResponse decorator: ${hasApiResponse ? 'YES' : 'NO'}`);
    console.log(`  ✓ @Controller('match') route: ${hasMatchRoute ? 'YES' : 'NO'}`);
    console.log(`  ✓ Health check endpoint: ${hasHealthCheck ? 'YES' : 'NO'}`);
    console.log('');

    const test3Pass = hasApiTags && hasApiOperation && hasApiResponse && hasMatchRoute && hasHealthCheck;
    console.log(test3Pass ? '✅ TEST 3 PASSED' : '❌ TEST 3 FAILED');
    console.log('');
    console.log('');

    // Test 4: Verify Service Structure
    console.log('TEST 4: Verify Service Structure');
    console.log('-'.repeat(80));

    const serviceSource = fs.readFileSync('./src/mt-01-exact-match.service.ts', 'utf-8');

    const hasInjectable = serviceSource.includes('@Injectable()');
    const hasTransactionDto = serviceSource.includes('TransactionDto');
    const hasDescription = serviceSource.includes('Exact Match Service') || serviceSource.includes('exact matching');

    console.log(`  ✓ @Injectable decorator: ${hasInjectable ? 'YES' : 'NO'}`);
    console.log(`  ✓ TransactionDto imported: ${hasTransactionDto ? 'YES' : 'NO'}`);
    console.log(`  ✓ Service description present: ${hasDescription ? 'YES' : 'NO'}`);
    console.log('');

    const test4Pass = hasInjectable && hasTransactionDto;
    console.log(test4Pass ? '✅ TEST 4 PASSED' : '❌ TEST 4 FAILED');
    console.log('');
    console.log('');

    // Test 5: Verify package.json Scripts
    console.log('TEST 5: Verify package.json Scripts');
    console.log('-'.repeat(80));

    const packageJson = JSON.parse(fs.readFileSync('../../package.json', 'utf-8'));
    const scripts = packageJson.scripts || {};

    const hasBuildMt01 = !!scripts['build:mt-01'];
    const hasStartMt01 = !!scripts['start:mt-01'];
    const hasStartMt01Dev = !!scripts['start:mt-01:dev'];

    console.log(`  ✓ build:mt-01 script: ${hasBuildMt01 ? 'YES' : 'NO'}`);
    console.log(`  ✓ start:mt-01 script: ${hasStartMt01 ? 'YES' : 'NO'}`);
    console.log(`  ✓ start:mt-01:dev script: ${hasStartMt01Dev ? 'YES' : 'NO'}`);
    console.log('');

    const test5Pass = hasBuildMt01 && hasStartMt01 && hasStartMt01Dev;
    console.log(test5Pass ? '✅ TEST 5 PASSED' : '❌ TEST 5 FAILED');
    console.log('');
    console.log('');

    // Test 6: TypeScript Compilation
    console.log('TEST 6: TypeScript Compilation');
    console.log('-'.repeat(80));

    const execSync = require('child_process').execSync;
    let buildSuccess = false;

    try {
      execSync('npm run build:mt-01', { stdio: 'pipe', cwd: path.join(__dirname, '../..') });
      buildSuccess = true;
      console.log('  ✅ MT-01 service compiles successfully');
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
      console.log('✅ ALL STEP 22 TESTS PASSED');
      console.log('');
      console.log('STEP 22 COMPLETE: MT-01 Exact Match Service Scaffold');
      console.log('');
      console.log('VERIFIED:');
      console.log('  ✓ File structure created correctly');
      console.log('  ✓ main.ts configured with ValidationPipe, Swagger, port 3003');
      console.log('  ✓ Controller has @ApiTags, health check endpoint');
      console.log('  ✓ Service has @Injectable, TransactionDto imported');
      console.log('  ✓ package.json scripts added (build:mt-01, start:mt-01, start:mt-01:dev)');
      console.log('  ✓ TypeScript compilation successful');
      console.log('');
      console.log('SERVICE CONFIGURATION:');
      console.log('  • Service: MT-01 Exact Match');
      console.log('  • Port: 3003');
      console.log('  • Swagger UI: http://localhost:3003/api');
      console.log('  • Health check: GET /match/health');
      console.log('  • Algorithm: Exact match (date + amount + description)');
      console.log('');
      console.log('SCAFFOLD READY FOR IMPLEMENTATION!');
      console.log('');
      console.log('To start the service:');
      console.log('  npm run start:mt-01:dev');
      console.log('');
      console.log('READY FOR STEP 23: Implement Exact Match Algorithm');
      console.log('='.repeat(80));
      process.exit(0);
    } else {
      console.log('❌ SOME STEP 22 TESTS FAILED');
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
testMt01Scaffold();
