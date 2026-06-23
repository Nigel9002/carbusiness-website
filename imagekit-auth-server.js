const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 🔥 HARDCODE KEYS HERE (TEMPORARY FIX FOR TESTING)
// ============================================================
const HARDCODED_PUBLIC_KEY = 'public_xn/PCZ7Vsv4rV/vkfR9hzYs0Ywo=';
const HARDCODED_PRIVATE_KEY = 'private_YcNs8U+l3/zHeenoUu5UGbF1HzU=';
const HARDCODED_URL_ENDPOINT = 'https://ik.imagekit.io/n1ihogbpq';
// ============================================================

// Enable CORS for all origins
app.use(cors());

// Serve static files (admin.html, index.html, etc.)
app.use(express.static(__dirname));

// Log startup configuration
console.log('🚀 Starting ImageKit Auth Server...');
console.log(`📁 Serving files from: ${__dirname}`);
console.log(`🔑 Public Key: ${HARDCODED_PUBLIC_KEY}`);
console.log(`🔗 URL Endpoint: ${HARDCODED_URL_ENDPOINT}`);
console.log(`🔒 Private Key length: ${HARDCODED_PRIVATE_KEY.length} characters`);

/**
 * GET /imagekit-auth
 * Returns authentication parameters for ImageKit uploads
 */
app.get('/imagekit-auth', (req, res) => {
    // Use hardcoded keys
    const privateKey = HARDCODED_PRIVATE_KEY;
    const publicKey = HARDCODED_PUBLIC_KEY;
    const urlEndpoint = HARDCODED_URL_ENDPOINT;

    // Validate
    if (!privateKey || privateKey.length < 10) {
        console.error('❌ Private key is invalid');
        return res.status(500).json({ 
            error: 'Private key is invalid',
            hint: 'Check hardcoded key'
        });
    }

    try {
        // Generate authentication parameters
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

        // Return all parameters
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

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        publicKey: HARDCODED_PUBLIC_KEY ? 'Configured' : 'Missing',
        urlEndpoint: HARDCODED_URL_ENDPOINT ? 'Configured' : 'Missing'
    });
});

/**
 * Handle 404 errors
 */
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.url} does not exist`
    });
});

/**
 * Handle other errors
 */
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log('\n✅ Server is running successfully!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`🏠 Index Page: http://localhost:${PORT}/index.html`);
    console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/imagekit-auth`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log('\n📋 Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});