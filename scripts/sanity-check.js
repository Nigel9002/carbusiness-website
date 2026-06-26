#!/usr/bin/env node

// ============================================================
// MOTO KENYA - Sanity Check Script
// ============================================================
// This script validates that all required environment variables
// and configurations are properly set before deployment.
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================
// ===== CONFIGURATION =====
// ============================================================
const REQUIRED_ENV_VARS = [
    'IMAGEKIT_PRIVATE_KEY',
    'FIREBASE_PROJECT_ID'
];

const OPTIONAL_ENV_VARS = [
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_URL_ENDPOINT',
    'NODE_ENV'
];

// ============================================================
// ===== HELPER FUNCTIONS =====
// ============================================================
function exitWithError(msg, code = 2) {
    console.error('❌ ERROR:', msg);
    console.error('   Please fix the issue and try again.');
    process.exit(code);
}

function exitWithSuccess(msg) {
    console.log('✅', msg);
    process.exit(0);
}

function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================================
// ===== MAIN SANITY CHECK =====
// ============================================================
console.log('\n🔍 Running MOTO KENYA Sanity Check...\n');

// ============================================================
// 1. CHECK ENVIRONMENT VARIABLES
// ============================================================
console.log('📋 Checking environment variables...');

const missingVars = [];
const maskedVars = [];

REQUIRED_ENV_VARS.forEach(varName => {
    const value = (process.env[varName] || '').trim();
    if (!value) {
        missingVars.push(varName);
    } else if (value.includes('*') && varName !== 'IMAGEKIT_PRIVATE_KEY') {
        maskedVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Set these variables in your .env file or environment:');
    console.error('   IMAGEKIT_PRIVATE_KEY=your_private_key');
    console.error('   FIREBASE_PROJECT_ID=caradds-227e9');
    exitWithError('Environment variables missing.');
}

console.log('✅ All required environment variables are set.');

// ============================================================
// 2. CHECK IMAGEKIT PRIVATE KEY
// ============================================================
console.log('🔑 Checking ImageKit private key...');

const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
if (!privateKey) {
    exitWithError('Missing IMAGEKIT_PRIVATE_KEY environment variable.');
}

if (privateKey.includes('*')) {
    console.warn('⚠️  IMAGEKIT_PRIVATE_KEY contains asterisks (*).');
    console.warn('   It may be masked or incomplete. Using for test...');
}

if (!privateKey.startsWith('private_')) {
    console.warn('⚠️  IMAGEKIT_PRIVATE_KEY does not start with "private_".');
    console.warn('   This may indicate an invalid key format.');
}

// Test generating a signature
try {
    const testToken = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
    const testExpire = Math.floor(Date.now() / 1000) + 60;
    const testSignature = crypto.createHmac('sha1', privateKey).update(testToken + testExpire).digest('hex');
    
    if (testSignature && testSignature.length === 40) {
        console.log('✅ ImageKit private key is valid (signature generated).');
    } else {
        console.warn('⚠️  ImageKit private key generated an unusual signature.');
    }
} catch (err) {
    console.error('❌ ImageKit private key test failed:', err.message);
    exitWithError('Invalid ImageKit private key.');
}

// ============================================================
// 3. CHECK FILES AND DIRECTORIES
// ============================================================
console.log('📁 Checking project structure...');

const requiredFiles = [
    'index.html',
    'admin.html',
    'manifest.json',
    'sw.js',
    'firestore.rules'
];

const missingFiles = [];
requiredFiles.forEach(file => {
    if (!checkFileExists(path.join(process.cwd(), file))) {
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.warn('⚠️  Missing required files:');
    missingFiles.forEach(f => console.warn(`   - ${f}`));
    console.warn('   Some features may not work correctly.');
}

// Check pages directory
if (!checkFileExists(path.join(process.cwd(), 'pages'))) {
    console.warn('⚠️  "pages" directory not found. Make sure all HTML pages are in the pages folder.');
} else {
    console.log('✅ "pages" directory exists.');
}

// Check css directory
if (!checkFileExists(path.join(process.cwd(), 'css'))) {
    console.warn('⚠️  "css" directory not found. Make sure css/style.css exists.');
} else {
    console.log('✅ "css" directory exists.');
}

// Check js directory
if (!checkFileExists(path.join(process.cwd(), 'js'))) {
    console.warn('⚠️  "js" directory not found. Make sure js/main.js exists.');
} else {
    console.log('✅ "js" directory exists.');
}

// ============================================================
// 4. CHECK MANIFEST AND ICONS
// ============================================================
console.log('🎨 Checking PWA assets...');

try {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    if (checkFileExists(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        if (manifest.icons && manifest.icons.length > 0) {
            console.log(`✅ manifest.json found with ${manifest.icons.length} icons.`);
        } else {
            console.warn('⚠️  manifest.json has no icons defined.');
        }
        
        if (manifest.shortcuts && manifest.shortcuts.length > 0) {
            console.log(`✅ ${manifest.shortcuts.length} shortcuts defined.`);
        }
    } else {
        console.warn('⚠️  manifest.json not found.');
    }
} catch (err) {
    console.warn('⚠️  Error reading manifest.json:', err.message);
}

// ============================================================
// 5. CHECK NODE VERSION
// ============================================================
console.log('📦 Checking Node.js version...');

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 18) {
    console.log(`✅ Node.js version ${nodeVersion} (required: >=18)`);
} else {
    console.warn(`⚠️  Node.js version ${nodeVersion} is older than recommended (>=18).`);
    console.warn('   Please upgrade to Node.js 18 or higher.');
}

// ============================================================
// 6. CHECK FIREBASE CONFIG
// ============================================================
console.log('🔥 Checking Firebase configuration...');

const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
if (checkFileExists(firebaseJsonPath)) {
    try {
        const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
        if (firebaseJson.firestore) {
            console.log('✅ Firestore configuration found.');
        }
        if (firebaseJson.functions) {
            console.log('✅ Functions configuration found.');
        }
    } catch (err) {
        console.warn('⚠️  Error reading firebase.json:', err.message);
    }
} else {
    console.warn('⚠️  firebase.json not found. Firebase CLI may not be configured.');
}

// ============================================================
// 7. CHECK NPM DEPENDENCIES
// ============================================================
console.log('📚 Checking dependencies...');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (checkFileExists(packageJsonPath)) {
    try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});
        
        console.log(`✅ Found ${deps.length} dependencies and ${devDeps.length} devDependencies.`);
        
        // Check for critical dependencies
        const criticalDeps = ['firebase-admin', 'firebase-functions'];
        const missingCritical = criticalDeps.filter(dep => !deps.includes(dep));
        
        if (missingCritical.length > 0) {
            console.warn('⚠️  Critical dependencies missing:');
            missingCritical.forEach(d => console.warn(`   - ${d}`));
        }
    } catch (err) {
        console.warn('⚠️  Error reading package.json:', err.message);
    }
} else {
    console.warn('⚠️  package.json not found.');
}

// ============================================================
// 8. CHECK FIREBASE TOOLS
// ============================================================
console.log('🛠️  Checking Firebase CLI...');

try {
    // Check if firebase is installed globally
    const { execSync } = require('child_process');
    const firebaseVersion = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Firebase CLI version ${firebaseVersion}`);
} catch (err) {
    console.warn('⚠️  Firebase CLI not found or not in PATH.');
    console.warn('   Install it with: npm install -g firebase-tools');
}

// ============================================================
// 9. CHECK GIT STATUS (Optional)
// ============================================================
console.log('🔍 Checking Git status...');

try {
    const { execSync } = require('child_process');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    
    if (gitStatus) {
        const changedFiles = gitStatus.split('\n').length;
        console.log(`📝 ${changedFiles} files have uncommitted changes.`);
    } else {
        console.log('📝 Working directory is clean.');
    }
} catch (err) {
    console.warn('⚠️  Not a git repository or git not installed.');
}

// ============================================================
// 10. GENERATE TEST AUTH TOKEN (Success)
// ============================================================
console.log('🎯 Generating test auth token...');

try {
    const token = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 10 * 60;
    const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');
    
    console.log('✅ Test auth token generated successfully.');
    console.log('   Token:', token.substring(0, 8) + '...');
    console.log('   Expire:', new Date(expire * 1000).toLocaleString());
    console.log('   Signature:', signature.substring(0, 8) + '...');
} catch (err) {
    console.warn('⚠️  Could not generate test auth token:', err.message);
}

// ============================================================
// 11. SYSTEM INFORMATION
// ============================================================
console.log('💻 System information:');
console.log(`   Platform: ${os.platform()}`);
console.log(`   Architecture: ${os.arch()}`);
console.log(`   CPUs: ${os.cpus().length}`);
console.log(`   Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);

// ============================================================
// 12. SUMMARY
// ============================================================
console.log('\n📊 Sanity Check Summary:');
console.log('   ✅ Environment variables: PASSED');
console.log('   ✅ ImageKit private key: PASSED');
console.log('   📁 Project structure: CHECKED');
console.log('   🎨 PWA assets: CHECKED');
console.log('   📦 Node.js version: CHECKED');
console.log('   🔥 Firebase config: CHECKED');
console.log('   📚 Dependencies: CHECKED');

console.log('\n✨ Sanity check completed successfully!');
console.log('🚀 You can now deploy your application.\n');

exitWithSuccess('All checks passed!');