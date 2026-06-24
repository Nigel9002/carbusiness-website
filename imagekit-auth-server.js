const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 🔥 HARDCODE KEYS HERE
// ============================================================
const HARDCODED_PUBLIC_KEY = 'public_xn/PCZ7Vsv4rV/vkfR9hzYs0Ywo=';
const HARDCODED_PRIVATE_KEY = 'private_YcNs8U+l3/zHeenoUu5UGbF1HzU=';
const HARDCODED_URL_ENDPOINT = 'https://ik.imagekit.io/n1ihogbpq';
// ============================================================

app.use(cors());

// ============================================================
// ===== CRITICAL FIX: Force fresh admin.html =====
// ============================================================
app.get('/admin.html', (req, res) => {
    // Read the file fresh from disk EVERY TIME
    const filePath = path.join(__dirname, 'admin.html');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error('❌ admin.html not found!');
        return res.status(404).send('admin.html not found');
    }
    
    // Read the file contents
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Set headers to prevent ANY caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    console.log('📄 Serving admin.html (fresh copy, reading from disk)');
    console.log(`   File size: ${fileContent.length} bytes`);
    console.log(`   File modified: ${fs.statSync(filePath).mtime}`);
    
    res.send(fileContent);
});

// ============================================================
// ===== SERVE INDEX.HTML WITH NO CACHE =====
// ============================================================
app.get('/index.html', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('index.html not found');
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log('📄 Serving index.html (fresh copy)');
    res.send(fileContent);
});

// ============================================================
// ===== SERVE OTHER STATIC FILES =====
// ============================================================
app.use(express.static(__dirname));

// ============================================================
// ===== API HEALTH CHECK =====
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'ImageKit Auth Server',
        port: PORT,
        publicKey: HARDCODED_PUBLIC_KEY ? '✅ Configured' : '❌ Missing',
        urlEndpoint: HARDCODED_URL_ENDPOINT ? '✅ Configured' : '❌ Missing',
        privateKey: HARDCODED_PRIVATE_KEY ? '✅ Configured' : '❌ Missing'
    });
});

// ============================================================
// ===== IMAGEKIT AUTH ENDPOINT =====
// ============================================================
app.get('/imagekit-auth', (req, res) => {
    const privateKey = HARDCODED_PRIVATE_KEY;
    const publicKey = HARDCODED_PUBLIC_KEY;
    const urlEndpoint = HARDCODED_URL_ENDPOINT;

    if (!privateKey || privateKey.length < 10) {
        console.error('❌ Private key is invalid');
        return res.status(500).json({ 
            error: 'Private key is invalid',
            hint: 'Check hardcoded key'
        });
    }

    try {
        const token = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 10 * 60;
        const signature = crypto
            .createHmac('sha1', privateKey)
            .update(token + expire)
            .digest('hex');

        console.log('✅ Auth generated successfully');
        console.log(`   Token: ${token.substring(0, 8)}...`);
        console.log(`   Expire: ${new Date(expire * 1000).toLocaleString()}`);
        console.log(`   Signature: ${signature.substring(0, 8)}...`);

        res.json({
            token,
            expire,
            signature,
            publicKey,
            urlEndpoint
        });

    } catch (error) {
        console.error('❌ Error generating auth:', error);
        res.status(500).json({ 
            error: 'Failed to generate authentication parameters',
            details: error.message 
        });
    }
});

// ============================================================
// ===== HEALTH CHECK =====
// ============================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        publicKey: HARDCODED_PUBLIC_KEY ? '✅ Configured' : '❌ Missing',
        urlEndpoint: HARDCODED_URL_ENDPOINT ? '✅ Configured' : '❌ Missing'
    });
});

// ============================================================
// ===== 404 HANDLER =====
// ============================================================
app.use((req, res) => {
    console.log(`⚠️ 404: ${req.url}`);
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.url} does not exist`
    });
});

// ============================================================
// ===== ERROR HANDLER =====
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

// ============================================================
// ===== START SERVER =====
// ============================================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 ImageKit Auth Server Started!');
    console.log('='.repeat(50));
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`🏠 Index Page: http://localhost:${PORT}/index.html`);
    console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/imagekit-auth`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`💚 API Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
    console.log(`🔑 Public Key: ${HARDCODED_PUBLIC_KEY}`);
    console.log(`🔗 URL Endpoint: ${HARDCODED_URL_ENDPOINT}`);
    console.log(`🔒 Private Key: ${HARDCODED_PRIVATE_KEY.substring(0, 15)}... (${HARDCODED_PRIVATE_KEY.length} chars)`);
    console.log('='.repeat(50));
    console.log('\n📋 Press Ctrl+C to stop the server');
});

// ============================================================
// ===== GRACEFUL SHUTDOWN =====
// ============================================================
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});