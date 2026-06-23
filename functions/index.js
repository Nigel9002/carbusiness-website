const crypto = require('crypto');
const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

// Initialize Firebase Admin
admin.initializeApp();

// ============================================================
// 🔥 HARDCODE YOUR IMAGEKIT KEYS HERE (FOR DEVELOPMENT)
// ============================================================
const IMAGEKIT_PUBLIC_KEY = 'public_xn/PCZ7Vsv4rV/vkfR9hzYs0Ywo=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/n1ihogbpq';
// ============================================================

// The ImageKit private key is stored as a function secret, not in client code.
const imageKitPrivateKey = defineSecret('IMAGEKIT_PRIVATE_KEY');
const adminEmails = new Set(['michaelnchege453@gmail.com']);

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

exports.imagekitAuth = onRequest({ secrets: [imageKitPrivateKey] }, async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const authHeader = req.get('Authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  // ============================================================
  // 🔥 DEVELOPMENT BYPASS - Remove this for production!
  // If you're testing locally without Firebase Auth, you can
  // comment out this bypass and use Firebase Auth instead.
  // ============================================================
  // For local testing, bypass Firebase auth
  const isLocal = process.env.NODE_ENV === 'development' || 
                  req.headers.host?.includes('localhost') ||
                  req.headers.host?.includes('127.0.0.1');
  
  // If in development mode, skip Firebase token validation
  if (isLocal) {
    console.log('🔓 DEVELOPMENT MODE - Skipping Firebase auth');
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      res.status(500).json({ error: 'ImageKit private key is missing.' });
      return;
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 10 * 60;
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    res.status(200).json({ 
      token, 
      expire, 
      signature,
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT
    });
    return;
  }

  // ============================================================
  // PRODUCTION - Firebase Auth Required
  // ============================================================
  if (!idToken) {
    res.status(401).json({ error: 'Missing Firebase login token.' });
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = String(decodedToken.email || '').toLowerCase();
    const isAdmin = decodedToken.admin === true || adminEmails.has(email);

    if (!isAdmin) {
      res.status(403).json({ error: 'This Firebase user is not allowed to upload images.' });
      return;
    }

    const privateKey = await getPrivateKey();
    if (!privateKey) {
      res.status(500).json({ error: 'ImageKit private key is missing.' });
      return;
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 10 * 60;
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    res.status(200).json({ 
      token, 
      expire, 
      signature,
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * Helper function to get the private key
 * Handles both Firebase Secrets and environment variables
 */
async function getPrivateKey() {
  try {
    // Try Firebase Secret first
    if (imageKitPrivateKey) {
      let privateKey = imageKitPrivateKey.value();
      if (privateKey && typeof privateKey.then === 'function') {
        privateKey = await privateKey;
      }
      if (privateKey) {
        privateKey = String(privateKey).trim();
        if (privateKey && !privateKey.includes('*')) {
          return privateKey;
        }
      }
    }
    
    // Fallback to environment variable (for local testing)
    const envKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    if (envKey && !envKey.includes('*')) {
      return envKey.trim();
    }
    
    console.error('❌ No valid private key found');
    return null;
  } catch (err) {
    console.error('❌ Error reading private key:', err);
    return null;
  }
}

/**
 * Health check endpoint
 */
exports.health = onRequest({ secrets: [imageKitPrivateKey] }, async (req, res) => {
  setCors(res);
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    publicKey: IMAGEKIT_PUBLIC_KEY ? 'Configured' : 'Missing',
    urlEndpoint: IMAGEKIT_URL_ENDPOINT ? 'Configured' : 'Missing',
    privateKeyConfigured: await getPrivateKey() ? '✅ Yes' : '❌ No'
  });
});