#!/usr/bin/env node

/**
 * Permission check utility for AI Workflow Utils
 * This script checks if the application has necessary permissions for file operations
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function checkPermissions() {
  console.log('🔍 Checking AI Workflow Utils permissions...\n');

  const projectRoot = process.cwd();
  const results = [];

  // Check 1: Project directory write permissions
  try {
    const projectUploadDir = path.join(projectRoot, 'uploads', 'build-scripts');
    await fs.mkdir(projectUploadDir, { recursive: true });
    
    const testFile = path.join(projectUploadDir, '.permission-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    
    results.push({
      check: 'Project Upload Directory',
      status: '✅ PASS',
      path: projectUploadDir,
      message: 'Can create and write to upload directory'
    });
  } catch (error) {
    results.push({
      check: 'Project Upload Directory',
      status: '⚠️  WARNING',
      path: path.join(projectRoot, 'uploads', 'build-scripts'),
      message: `Cannot write to project directory: ${error.message}`
    });
  }

  // Check 2: Temp directory fallback
  try {
    const tempUploadDir = path.join(os.tmpdir(), 'ai-workflow-utils', 'build-scripts');
    await fs.mkdir(tempUploadDir, { recursive: true });
    
    const testFile = path.join(tempUploadDir, '.permission-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    
    results.push({
      check: 'Temp Directory Fallback',
      status: '✅ PASS',
      path: tempUploadDir,
      message: 'Can use temp directory as fallback'
    });
  } catch (error) {
    results.push({
      check: 'Temp Directory Fallback',
      status: '❌ FAIL',
      path: path.join(os.tmpdir(), 'ai-workflow-utils', 'build-scripts'),
      message: `Cannot write to temp directory: ${error.message}`
    });
  }

  // Check 3: Custom directory (if set)
  if (process.env.UPLOAD_DIR) {
    try {
      const customUploadDir = path.join(process.env.UPLOAD_DIR, 'build-scripts');
      await fs.mkdir(customUploadDir, { recursive: true });
      
      const testFile = path.join(customUploadDir, '.permission-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      results.push({
        check: 'Custom Upload Directory',
        status: '✅ PASS',
        path: customUploadDir,
        message: 'Custom upload directory is writable'
      });
    } catch (error) {
      results.push({
        check: 'Custom Upload Directory',
        status: '❌ FAIL',
        path: path.join(process.env.UPLOAD_DIR, 'build-scripts'),
        message: `Cannot write to custom directory: ${error.message}`
      });
    }
  }

  // Display results
  console.log('Permission Check Results:');
  console.log('========================\n');

  let hasWarnings = false;
  let hasErrors = false;

  results.forEach(result => {
    console.log(`${result.check}:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Path: ${result.path}`);
    console.log(`  Message: ${result.message}\n`);

    if (result.status.includes('WARNING')) hasWarnings = true;
    if (result.status.includes('FAIL')) hasErrors = true;
  });

  // Summary and recommendations
  console.log('Summary:');
  console.log('========\n');

  if (!hasErrors && !hasWarnings) {
    console.log('🎉 All permission checks passed! The application should work without issues.');
  } else if (hasWarnings && !hasErrors) {
    console.log('⚠️  Some warnings detected, but the application should still work.');
    console.log('   The app will use temp directory fallback for file uploads.');
  } else {
    console.log('❌ Critical permission issues detected!');
    console.log('\nRecommended solutions:');
    console.log('1. Run with appropriate permissions:');
    console.log(`   sudo chown -R $USER:$USER ${projectRoot}`);
    console.log('2. Or set a custom upload directory:');
    console.log('   export UPLOAD_DIR=/path/to/writable/directory');
    console.log('3. Check the DEPLOYMENT.md file for detailed setup instructions.');
  }

  console.log('\nFor more information, see: DEPLOYMENT.md');
  
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  checkPermissions().catch(console.error);
}

module.exports = { checkPermissions };
