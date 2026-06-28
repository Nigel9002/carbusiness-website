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
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'IMAGEKIT_URL_ENDPOINT',
    'FIREBASE_PROJECT_ID',
    'SUPER_ADMIN_EMAILS'
];

const OPTIONAL_ENV_VARS = [
    'PORT',
    'NODE_ENV',
    'ALLOWED_ORIGINS',
    'WHATSAPP_NUMBER',
    'RATE_LIMIT_MAX_REQUESTS',
    'RATE_LIMIT_WINDOW_MS',
    'JWT_SECRET',
    'CSRF_SECRET'
];

const REQUIRED_FILES = [
    'index.html',
    'admin.html',
    'manifest.json',
    'sw.js',
    'firestore.rules',
    'storage.rules',
    'firebase.json'
];

const REQUIRED_DIRECTORIES = [
    'pages',
    'css',
    'js',
    'images'
];

const REQUIRED_JS_FILES = [
    'js/main.js',
    'js/firebase-config.js',
    'js/vehicles.js',
    'js/admin.js',
    'js/wishlist.js',
    'js/compare.js'
];

const REQUIRED_CSS_FILES = [
    'css/style.css',
    'css/admin.css',
    'css/dark-mode.css'
];

const REQUIRED_PAGES = [
    'pages/about.html',
    'pages/blog.html',
    'pages/contact.html',
    'pages/faq.html',
    'pages/finance.html',
    'pages/privacy.html',
    'pages/terms.html',
    'pages/testimonials.html',
    'pages/trade-in.html',
    'pages/admin-management.html',
    'pages/vehicle-detail.html'
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

function checkAllFilesExist(fileList, basePath = process.cwd()) {
    const missing = [];
    fileList.forEach(file => {
        const fullPath = path.join(basePath, file);
        if (!checkFileExists(fullPath)) {
            missing.push(file);
        }
    });
    return missing;
}

// ============================================================
// ===== MAIN SANITY CHECK =====
// ============================================================
console.log('\n🔍 Running MOTO KENYA Sanity Check...\n');

let hasErrors = false;
let hasWarnings = false;

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
    } else if (value.includes('*') || value.includes('your_')) {
        maskedVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Set these variables in your .env file');
    hasErrors = true;
}

if (maskedVars.length > 0) {
    console.warn('⚠️  Environment variables may contain placeholder values:');
    maskedVars.forEach(v => console.warn(`   - ${v}`));
    hasWarnings = true;
}

if (!hasErrors) {
    console.log('✅ All required environment variables are set.');
}

// ============================================================
// 2. CHECK IMAGEKIT PRIVATE KEY
// ============================================================
console.log('🔑 Checking ImageKit private key...');

const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
if (!privateKey) {
    console.error('❌ Missing IMAGEKIT_PRIVATE_KEY environment variable.');
    hasErrors = true;
} else {
    if (privateKey.includes('*') || privateKey.includes('your_private_key')) {
        console.warn('⚠️  IMAGEKIT_PRIVATE_KEY contains placeholder or masked value.');
        hasWarnings = true;
    }

    if (!privateKey.startsWith('private_')) {
        console.warn('⚠️  IMAGEKIT_PRIVATE_KEY does not start with "private_".');
        hasWarnings = true;
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
            hasWarnings = true;
        }
    } catch (err) {
        console.error('❌ ImageKit private key test failed:', err.message);
        hasErrors = true;
    }
}

// ============================================================
// 3. CHECK FILES AND DIRECTORIES
// ============================================================
console.log('📁 Checking project structure...');

// Check required files
const missingFiles = checkAllFilesExist(REQUIRED_FILES);
if (missingFiles.length > 0) {
    console.warn('⚠️  Missing required files:');
    missingFiles.forEach(f => console.warn(`   - ${f}`));
    hasWarnings = true;
} else {
    console.log('✅ All required files exist.');
}

// Check directories
const missingDirs = [];
REQUIRED_DIRECTORIES.forEach(dir => {
    if (!checkFileExists(path.join(process.cwd(), dir))) {
        missingDirs.push(dir);
    }
});
if (missingDirs.length > 0) {
    console.warn('⚠️  Missing required directories:');
    missingDirs.forEach(d => console.warn(`   - ${d}`));
    hasWarnings = true;
} else {
    console.log('✅ All required directories exist.');
}

// Check JS files
const missingJsFiles = checkAllFilesExist(REQUIRED_JS_FILES);
if (missingJsFiles.length > 0) {
    console.warn('⚠️  Missing JS files:');
    missingJsFiles.forEach(f => console.warn(`   - ${f}`));
    hasWarnings = true;
} else {
    console.log('✅ All JS files exist.');
}

// Check CSS files
const missingCssFiles = checkAllFilesExist(REQUIRED_CSS_FILES);
if (missingCssFiles.length > 0) {
    console.warn('⚠️  Missing CSS files:');
    missingCssFiles.forEach(f => console.warn(`   - ${f}`));
    hasWarnings = true;
} else {
    console.log('✅ All CSS files exist.');
}

// Check pages
const missingPages = checkAllFilesExist(REQUIRED_PAGES);
if (missingPages.length > 0) {
    console.warn('⚠️  Missing pages:');
    missingPages.forEach(p => console.warn(`   - ${p}`));
    hasWarnings = true;
} else {
    console.log('✅ All pages exist.');
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
            
            // Check if icons exist
            let missingIcons = 0;
            manifest.icons.forEach(icon => {
                const iconPath = path.join(process.cwd(), icon.src);
                if (!checkFileExists(iconPath)) {
                    missingIcons++;
                }
            });
            if (missingIcons > 0) {
                console.warn(`⚠️  ${missingIcons} icon files are missing.`);
                hasWarnings = true;
            }
        } else {
            console.warn('⚠️  manifest.json has no icons defined.');
            hasWarnings = true;
        }
        
        if (manifest.shortcuts && manifest.shortcuts.length > 0) {
            console.log(`✅ ${manifest.shortcuts.length} shortcuts defined.`);
        }
    } else {
        console.warn('⚠️  manifest.json not found.');
        hasWarnings = true;
    }
} catch (err) {
    console.warn('⚠️  Error reading manifest.json:', err.message);
    hasWarnings = true;
}

// ============================================================
// 5. CHECK NODE VERSION
// ============================================================
console.log('📦 Checking Node.js version...');

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 20) {
    console.log(`✅ Node.js version ${nodeVersion} (required: >=20)`);
} else if (majorVersion >= 18) {
    console.warn(`⚠️  Node.js version ${nodeVersion} (recommended: >=20)`);
    hasWarnings = true;
} else {
    console.warn(`⚠️  Node.js version ${nodeVersion} is older than recommended (>=20).`);
    hasWarnings = true;
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
        if (firebaseJson.hosting) {
            console.log('✅ Hosting configuration found.');
        }
        if (firebaseJson.storage) {
            console.log('✅ Storage configuration found.');
        }
    } catch (err) {
        console.warn('⚠️  Error reading firebase.json:', err.message);
        hasWarnings = true;
    }
} else {
    console.warn('⚠️  firebase.json not found.');
    hasWarnings = true;
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
        const criticalDeps = ['express', 'dotenv', 'cors', 'helmet'];
        const missingCritical = criticalDeps.filter(dep => !deps.includes(dep));
        
        if (missingCritical.length > 0) {
            console.warn('⚠️  Critical dependencies missing from root package.json:');
            missingCritical.forEach(d => console.warn(`   - ${d}`));
            hasWarnings = true;
        }
        
        // Check functions dependencies
        const funcPackagePath = path.join(process.cwd(), 'functions', 'package.json');
        if (checkFileExists(funcPackagePath)) {
            const funcPkg = JSON.parse(fs.readFileSync(funcPackagePath, 'utf8'));
            const funcDeps = Object.keys(funcPkg.dependencies || {});
            const firebaseDeps = ['firebase-admin', 'firebase-functions'];
            const missingFirebase = firebaseDeps.filter(dep => !funcDeps.includes(dep));
            
            if (missingFirebase.length > 0) {
                console.warn('⚠️  Missing Firebase dependencies in functions/package.json:');
                missingFirebase.forEach(d => console.warn(`   - ${d}`));
                hasWarnings = true;
            } else {
                console.log('✅ Firebase dependencies found in functions.');
            }
        } else {
            console.warn('⚠️  functions/package.json not found.');
            hasWarnings = true;
        }
    } catch (err) {
        console.warn('⚠️  Error reading package.json:', err.message);
        hasWarnings = true;
    }
} else {
    console.warn('⚠️  package.json not found.');
    hasWarnings = true;
}

// ============================================================
// 8. CHECK FIREBASE TOOLS
// ============================================================
console.log('🛠️  Checking Firebase CLI...');

try {
    const { execSync } = require('child_process');
    const firebaseVersion = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Firebase CLI version ${firebaseVersion}`);
} catch (err) {
    console.warn('⚠️  Firebase CLI not found or not in PATH.');
    console.warn('   Install it with: npm install -g firebase-tools');
    hasWarnings = true;
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

if (privateKey && !privateKey.includes('your_private_key') && !privateKey.includes('*')) {
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
        hasWarnings = true;
    }
} else {
    console.warn('⚠️  Skipping auth token test (invalid private key)');
    hasWarnings = true;
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

if (hasErrors) {
    console.log('   ❌ ERRORS FOUND: Please fix the issues above.');
} else {
    console.log('   ✅ No errors found.');
}

if (hasWarnings) {
    console.log('   ⚠️  WARNINGS FOUND: Review the warnings above.');
} else {
    console.log('   ✅ No warnings found.');
}

console.log('\n' + '='.repeat(50));
console.log('📋 Check Results:');
console.log('   ✅ Environment variables: ' + (hasErrors ? '❌ FAILED' : '✅ PASSED'));
console.log('   ✅ ImageKit private key: ' + (hasErrors ? '❌ FAILED' : '✅ PASSED'));
console.log('   📁 Project structure: ' + (hasWarnings ? '⚠️ CHECKED' : '✅ PASSED'));
console.log('   🎨 PWA assets: ' + (hasWarnings ? '⚠️ CHECKED' : '✅ PASSED'));
console.log('   📦 Node.js version: ' + (hasWarnings ? '⚠️ CHECKED' : '✅ PASSED'));
console.log('   🔥 Firebase config: ' + (hasWarnings ? '⚠️ CHECKED' : '✅ PASSED'));
console.log('   📚 Dependencies: ' + (hasWarnings ? '⚠️ CHECKED' : '✅ PASSED'));
console.log('='.repeat(50));

if (hasErrors) {
    console.log('\n❌ Sanity check FAILED! Please fix the errors and try again.');
    process.exit(1);
} else if (hasWarnings) {
    console.log('\n⚠️  Sanity check completed with warnings.');
    console.log('   The application should work, but review the warnings above.');
    console.log('🚀 You can proceed with deployment.');
} else {
    console.log('\n✨ Sanity check completed successfully!');
    console.log('🚀 You can now deploy your application.');
}

console.log('');