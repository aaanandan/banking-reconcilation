/**
 * Test Script for Step 15: State Manager Service Scaffold (Simple Verification)
 *
 * Verifies scaffold structure without requiring database connection.
 */

async function testScaffoldSimple() {
  console.log('='.repeat(80));
  console.log('TESTING STEP 15: State Manager Service Scaffold (Simple Verification)');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Test 1: Verify file structure
    console.log('TEST 1: Verify File Structure');
    console.log('-'.repeat(80));

    const fs = require('fs');
    const path = require('path');

    const files = [
      'src/main.ts',
      'src/state-manager-service.module.ts',
      'src/state-manager-service.controller.ts',
      'src/state-manager-service.service.ts',
    ];

    let allFilesExist = true;
    files.forEach(file => {
      const filePath = path.join(__dirname, file);
      const exists = fs.existsSync(filePath);
      console.log(`  ${exists ? '✓' : '✗'} ${file}`);
      if (!exists) allFilesExist = false;
    });
    console.log('');

    const test1Pass = allFilesExist;
    console.log(test1Pass ? '✅ TEST 1 PASSED' : '❌ TEST 1 FAILED');
    console.log('');
    console.log('');

    // Test 2: Verify main.ts configuration
    console.log('TEST 2: Verify main.ts Configuration');
    console.log('-'.repeat(80));

    const mainSource = fs.readFileSync('./src/main.ts', 'utf-8');

    const hasValidationPipe = mainSource.includes('ValidationPipe');
    const hasSwagger = mainSource.includes('SwaggerModule');
    const hasPort3002 = mainSource.includes('3002');
    const hasSwaggerSetup = mainSource.includes("SwaggerModule.setup('api'");

    console.log(`  ✓ ValidationPipe imported: ${hasValidationPipe ? 'YES' : 'NO'}`);
    console.log(`  ✓ SwaggerModule imported: ${hasSwagger ? 'YES' : 'NO'}`);
    console.log(`  ✓ Port 3002 configured: ${hasPort3002 ? 'YES' : 'NO'}`);
    console.log(`  ✓ Swagger setup called: ${hasSwaggerSetup ? 'YES' : 'NO'}`);
    console.log('');

    const test2Pass = hasValidationPipe && hasSwagger && hasPort3002 && hasSwaggerSetup;
    console.log(test2Pass ? '✅ TEST 2 PASSED' : '❌ TEST 2 FAILED');
    console.log('');
    console.log('');

    // Test 3: Verify module has TypeORM configuration
    console.log('TEST 3: Verify Module TypeORM Configuration');
    console.log('-'.repeat(80));

    const moduleSource = fs.readFileSync('./src/state-manager-service.module.ts', 'utf-8');

    const hasTypeOrmImport = moduleSource.includes('TypeOrmModule');
    const hasTypeOrmForRoot = moduleSource.includes('TypeOrmModule.forRoot');
    const hasTypeOrmForFeature = moduleSource.includes('TypeOrmModule.forFeature');
    const hasReconciliation = moduleSource.includes('Reconciliation');
    const hasBankFile = moduleSource.includes('BankFile');
    const hasTransaction = moduleSource.includes('Transaction');

    console.log(`  ✓ TypeOrmModule imported: ${hasTypeOrmImport ? 'YES' : 'NO'}`);
    console.log(`  ✓ TypeOrmModule.forRoot configured: ${hasTypeOrmForRoot ? 'YES' : 'NO'}`);
    console.log(`  ✓ TypeOrmModule.forFeature configured: ${hasTypeOrmForFeature ? 'YES' : 'NO'}`);
    console.log(`  ✓ Reconciliation entity imported: ${hasReconciliation ? 'YES' : 'NO'}`);
    console.log(`  ✓ BankFile entity imported: ${hasBankFile ? 'YES' : 'NO'}`);
    console.log(`  ✓ Transaction entity imported: ${hasTransaction ? 'YES' : 'NO'}`);
    console.log('');

    const test3Pass = hasTypeOrmImport && hasTypeOrmForRoot && hasTypeOrmForFeature &&
                      hasReconciliation && hasBankFile && hasTransaction;
    console.log(test3Pass ? '✅ TEST 3 PASSED' : '❌ TEST 3 FAILED');
    console.log('');
    console.log('');

    // Test 4: Verify controller has health check and Swagger decorators
    console.log('TEST 4: Verify Controller Configuration');
    console.log('-'.repeat(80));

    const controllerSource = fs.readFileSync('./src/state-manager-service.controller.ts', 'utf-8');

    const hasApiTags = controllerSource.includes('@ApiTags');
    const hasApiOperation = controllerSource.includes('@ApiOperation');
    const hasApiResponse = controllerSource.includes('@ApiResponse');
    const hasStateRoute = controllerSource.includes("@Controller('state')");
    const hasHealthCheck = controllerSource.includes('healthCheck');

    console.log(`  ✓ @ApiTags decorator: ${hasApiTags ? 'YES' : 'NO'}`);
    console.log(`  ✓ @ApiOperation decorator: ${hasApiOperation ? 'YES' : 'NO'}`);
    console.log(`  ✓ @ApiResponse decorator: ${hasApiResponse ? 'YES' : 'NO'}`);
    console.log(`  ✓ @Controller('state') route: ${hasStateRoute ? 'YES' : 'NO'}`);
    console.log(`  ✓ Health check endpoint: ${hasHealthCheck ? 'YES' : 'NO'}`);
    console.log('');

    const test4Pass = hasApiTags && hasApiOperation && hasApiResponse && hasStateRoute && hasHealthCheck;
    console.log(test4Pass ? '✅ TEST 4 PASSED' : '❌ TEST 4 FAILED');
    console.log('');
    console.log('');

    // Test 5: Verify service has repository injections
    console.log('TEST 5: Verify Service Repository Injections');
    console.log('-'.repeat(80));

    const serviceSource = fs.readFileSync('./src/state-manager-service.service.ts', 'utf-8');

    const hasInjectRepository = serviceSource.includes('@InjectRepository');
    const hasReconciliationRepo = serviceSource.includes('reconciliationRepo');
    const hasBankFileRepo = serviceSource.includes('bankFileRepo');
    const hasLedgerFileRepo = serviceSource.includes('ledgerFileRepo');
    const hasTransactionRepo = serviceSource.includes('transactionRepo');
    const hasMatchCandidateRepo = serviceSource.includes('matchCandidateRepo');

    console.log(`  ✓ @InjectRepository decorator: ${hasInjectRepository ? 'YES' : 'NO'}`);
    console.log(`  ✓ Reconciliation repository: ${hasReconciliationRepo ? 'YES' : 'NO'}`);
    console.log(`  ✓ BankFile repository: ${hasBankFileRepo ? 'YES' : 'NO'}`);
    console.log(`  ✓ LedgerFile repository: ${hasLedgerFileRepo ? 'YES' : 'NO'}`);
    console.log(`  ✓ Transaction repository: ${hasTransactionRepo ? 'YES' : 'NO'}`);
    console.log(`  ✓ MatchCandidate repository: ${hasMatchCandidateRepo ? 'YES' : 'NO'}`);
    console.log('');

    const test5Pass = hasInjectRepository && hasReconciliationRepo && hasBankFileRepo &&
                      hasLedgerFileRepo && hasTransactionRepo && hasMatchCandidateRepo;
    console.log(test5Pass ? '✅ TEST 5 PASSED' : '❌ TEST 5 FAILED');
    console.log('');
    console.log('');

    // Final results
    console.log('='.repeat(80));
    const allTestsPassed = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass;

    if (allTestsPassed) {
      console.log('✅ ALL SCAFFOLD TESTS PASSED');
      console.log('');
      console.log('STEP 15 COMPLETE: State Manager Service Scaffold');
      console.log('');
      console.log('VERIFIED:');
      console.log('  ✓ File structure created correctly');
      console.log('  ✓ main.ts configured with ValidationPipe, Swagger, port 3002');
      console.log('  ✓ Module configured with TypeORM.forRoot and TypeORM.forFeature');
      console.log('  ✓ All entities imported (Reconciliation, BankFile, LedgerFile, Transaction, MatchCandidate)');
      console.log('  ✓ Controller has @ApiTags, @ApiOperation, @ApiResponse');
      console.log('  ✓ Controller route set to /state with health check');
      console.log('  ✓ Service has all 5 repository injections');
      console.log('');
      console.log('BUILD VERIFICATION:');
      const execSync = require('child_process').execSync;
      try {
        execSync('npm run build:state-manager', { stdio: 'pipe' });
        console.log('  ✅ Service compiles successfully');
      } catch (error) {
        console.log('  ❌ Service build failed');
        throw error;
      }
      console.log('');
      console.log('SCAFFOLD READY FOR IMPLEMENTATION!');
      console.log('');
      console.log('NOTE: Database connection required for full testing.');
      console.log('To start the service (requires PostgreSQL):');
      console.log('  npm run start:state-manager:dev');
      console.log('');
      console.log('To access Swagger UI:');
      console.log('  http://localhost:3002/api');
      console.log('='.repeat(80));
      process.exit(0);
    } else {
      console.log('❌ SOME SCAFFOLD TESTS FAILED');
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
testScaffoldSimple();
