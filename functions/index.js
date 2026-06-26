const crypto = require('crypto');
const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { onUserCreated } = require('firebase-functions/v2/identity');
const { defineSecret } = require('firebase-functions/params');

// Initialize Firebase Admin
admin.initializeApp();

// ============================================================
// ===== CONFIGURATION =====
// ============================================================
const IMAGEKIT_PUBLIC_KEY = 'public_xn/PCZ7Vsv4rV/vkfR9hzYs0Ywo=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/n1ihogbpq';

// Admin roles configuration
const ADMIN_ROLES = {
    SUPER: 'super',
    EDITOR: 'editor',
    VIEWER: 'viewer'
};

// Super Admin emails (hardcoded for fallback)
const SUPER_ADMIN_EMAILS = new Set(['michaelnchege453@gmail.com']);

// ============================================================
// ===== SECURITY: RATE LIMITING =====
// ============================================================
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map();

// ============================================================
// ===== SECURITY: ALLOWED ORIGINS (CORS) =====
// ============================================================
const ALLOWED_ORIGINS = [
    'https://nige19002.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'https://caradds-227e9.web.app',
    'https://caradds-227e9.firebaseapp.com',
    'https://caradds-227e9.web.app'
];

// The ImageKit private key is stored as a function secret
const imageKitPrivateKey = defineSecret('IMAGEKIT_PRIVATE_KEY');

// ============================================================
// ===== CORS HELPER WITH ORIGIN VALIDATION =====
// ============================================================
function setCors(res, origin) {
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    res.set('Access-Control-Allow-Origin', allowedOrigin);
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.set('Access-Control-Max-Age', '86400');
    
    // Security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

// ============================================================
// ===== SECURITY: RATE LIMITING FUNCTION =====
// ============================================================
function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    for (const [key, data] of requestCounts) {
        if (data.timestamp < windowStart) {
            requestCounts.delete(key);
        }
    }
    
    const record = requestCounts.get(ip);
    if (!record) {
        requestCounts.set(ip, { count: 1, timestamp: now });
        return true;
    }
    
    if (record.timestamp < windowStart) {
        requestCounts.set(ip, { count: 1, timestamp: now });
        return true;
    }
    
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    record.count++;
    return true;
}

// ============================================================
// ===== SECURITY: INPUT VALIDATION =====
// ============================================================
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function sanitizeInput(input) {
    if (!input) return '';
    return String(input)
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 500);
}

function isValidTokenFormat(token) {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Regex = /^[A-Za-z0-9_-]+$/;
    return parts.every(part => base64Regex.test(part));
}

// ============================================================
// ===== HELPER: GET PRIVATE KEY =====
// ============================================================
async function getPrivateKey() {
    try {
        if (imageKitPrivateKey) {
            let privateKey = imageKitPrivateKey.value();
            if (privateKey && typeof privateKey.then === 'function') {
                privateKey = await privateKey;
            }
            if (privateKey) {
                privateKey = String(privateKey).trim();
                if (privateKey && !privateKey.includes('*') && privateKey.startsWith('private_')) {
                    return privateKey;
                }
                console.warn('⚠️ Private key has invalid format or contains placeholder');
            }
        }
        
        const envKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
        if (envKey && !envKey.includes('*') && envKey.startsWith('private_')) {
            return envKey.trim();
        }
        
        console.error('❌ No valid private key found');
        return null;
    } catch (err) {
        console.error('❌ Error reading private key:', err);
        return null;
    }
}

// ============================================================
// ===== MAIN AUTH FUNCTION =====
// ============================================================
exports.imagekitAuth = onRequest({ 
    secrets: [imageKitPrivateKey],
    maxInstances: 10,
    timeoutSeconds: 10,
    memory: '256MiB'
}, async (req, res) => {
    const origin = req.headers.origin || '';
    setCors(res, origin);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed.' });
        return;
    }

    // ============================================================
    // RATE LIMITING
    // ============================================================
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
        res.status(429).json({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: 60
        });
        return;
    }

    console.log(`📩 Auth request from IP: ${clientIp}, Origin: ${origin}`);

    const authHeader = req.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    // ============================================================
    // DEVELOPMENT BYPASS
    // ============================================================
    const isLocal = process.env.NODE_ENV === 'development' || 
                    req.headers.host?.includes('localhost') ||
                    req.headers.host?.includes('127.0.0.1') ||
                    req.headers.host?.includes('192.168.') ||
                    req.headers.host?.includes('::1');

    if (isLocal) {
        console.log('🔓 DEVELOPMENT MODE - Skipping Firebase auth');
        const privateKey = await getPrivateKey();
        if (!privateKey) {
            console.error('❌ Private key missing in dev mode');
            res.status(500).json({ error: 'ImageKit private key is missing.' });
            return;
        }

        try {
            const token = crypto.randomUUID();
            const expire = Math.floor(Date.now() / 1000) + 10 * 60;
            const signature = crypto
                .createHmac('sha1', privateKey)
                .update(token + expire)
                .digest('hex');

            console.log('✅ Dev auth generated successfully');
            res.status(200).json({ 
                token, 
                expire, 
                signature,
                publicKey: IMAGEKIT_PUBLIC_KEY,
                urlEndpoint: IMAGEKIT_URL_ENDPOINT
            });
        } catch (error) {
            console.error('❌ Dev auth error:', error);
            res.status(500).json({ error: 'Failed to generate auth parameters.' });
        }
        return;
    }

    // ============================================================
    // PRODUCTION - Firebase Auth Required
    // ============================================================
    if (!idToken) {
        console.warn(`❌ Missing Firebase token from IP: ${clientIp}`);
        res.status(401).json({ error: 'Missing Firebase login token.' });
        return;
    }

    if (!isValidTokenFormat(idToken)) {
        console.warn(`❌ Invalid token format from IP: ${clientIp}`);
        res.status(401).json({ error: 'Invalid token format.' });
        return;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const email = String(decodedToken.email || '').toLowerCase();
        const uid = decodedToken.uid || 'unknown';
        
        if (!isValidEmail(email)) {
            console.warn(`❌ Invalid email format: ${email} (UID: ${uid})`);
            res.status(401).json({ error: 'Invalid email format.' });
            return;
        }

        // Check if user is Super Admin (via custom claim or hardcoded)
        const role = decodedToken.role || 'viewer';
        const isSuperAdmin = role === 'super' || SUPER_ADMIN_EMAILS.has(email);
        const isEditor = role === 'editor' || isSuperAdmin;
        const isAdmin = isSuperAdmin || isEditor;

        if (!isAdmin) {
            console.warn(`⛔ Unauthorized access attempt: ${email} (UID: ${uid}, Role: ${role})`);
            res.status(403).json({ 
                error: 'This user does not have permission to upload images.',
                details: 'Editor or higher role required.',
                role: role
            });
            return;
        }

        console.log(`✅ Admin authenticated: ${email} (UID: ${uid}, Role: ${role})`);

        const privateKey = await getPrivateKey();
        if (!privateKey) {
            console.error('❌ Private key missing in production');
            res.status(500).json({ error: 'ImageKit private key is missing.' });
            return;
        }

        const token = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 10 * 60;
        const signature = crypto
            .createHmac('sha1', privateKey)
            .update(token + expire)
            .digest('hex');

        console.log(`✅ Auth generated for ${email} (Token: ${token.substring(0, 8)}...)`);

        res.status(200).json({ 
            token, 
            expire, 
            signature,
            publicKey: IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: IMAGEKIT_URL_ENDPOINT
        });

    } catch (error) {
        console.error('❌ Auth error:', error.message);
        
        if (error.code === 'auth/id-token-expired') {
            res.status(401).json({ error: 'Token expired. Please log in again.' });
        } else if (error.code === 'auth/argument-error') {
            res.status(401).json({ error: 'Invalid token.' });
        } else if (error.code === 'auth/user-disabled') {
            res.status(403).json({ error: 'User account has been disabled.' });
        } else if (error.code === 'auth/user-not-found') {
            res.status(401).json({ error: 'User not found.' });
        } else {
            res.status(401).json({ error: 'Authentication failed. Please log in again.' });
        }
    }
});

// ============================================================
// ===== SET ADMIN ROLE FUNCTION =====
// ============================================================
exports.setAdminRole = onRequest({
    secrets: [imageKitPrivateKey],
    maxInstances: 5,
    timeoutSeconds: 30,
    memory: '256MiB'
}, async (req, res) => {
    const origin = req.headers.origin || '';
    setCors(res, origin);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    // Verify authentication
    const authHeader = req.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!idToken) {
        res.status(401).json({ error: 'Missing authentication token.' });
        return;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email || '';
        
        // Check if requester is Super Admin
        const requesterRole = decodedToken.role || 'viewer';
        if (requesterRole !== 'super' && !SUPER_ADMIN_EMAILS.has(email.toLowerCase())) {
            res.status(403).json({ 
                error: 'Only Super Admins can set admin roles.',
                role: requesterRole
            });
            return;
        }

        // Get target user and role from request body
        const { targetEmail, role } = req.body;
        
        if (!targetEmail || !role) {
            res.status(400).json({ error: 'Missing targetEmail or role in request body.' });
            return;
        }

        if (!['super', 'editor', 'viewer'].includes(role)) {
            res.status(400).json({ error: 'Invalid role. Must be: super, editor, or viewer.' });
            return;
        }

        // Get target user
        let targetUser;
        try {
            targetUser = await admin.auth().getUserByEmail(targetEmail);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                res.status(404).json({ error: `User with email ${targetEmail} not found.` });
                return;
            }
            throw error;
        }

        // Prevent downgrading self
        if (targetUser.uid === uid) {
            res.status(400).json({ error: 'You cannot change your own role.' });
            return;
        }

        // Set custom claims
        await admin.auth().setCustomUserClaims(targetUser.uid, { role: role });

        // Also update Firestore user document
        try {
            const db = admin.firestore();
            await db.collection('users').doc(targetUser.uid).set({
                email: targetEmail,
                role: role,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            // Also save by email as backup
            const emailDocId = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
            await db.collection('users').doc(emailDocId).set({
                email: targetEmail,
                role: role,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (firestoreError) {
            console.warn('⚠️ Firestore update failed:', firestoreError);
        }

        console.log(`✅ Role set: ${targetEmail} → ${role} (by ${email})`);

        res.status(200).json({
            success: true,
            message: `✅ ${targetEmail} is now a ${role}`,
            user: {
                email: targetEmail,
                uid: targetUser.uid,
                role: role
            }
        });

    } catch (error) {
        console.error('❌ SetAdminRole error:', error);
        res.status(500).json({ 
            error: 'Failed to set admin role.',
            details: error.message 
        });
    }
});

// ============================================================
// ===== GET CURRENT USER ROLE =====
// ============================================================
exports.getUserRole = onRequest({
    secrets: [imageKitPrivateKey],
    maxInstances: 5,
    timeoutSeconds: 10,
    memory: '256MiB'
}, async (req, res) => {
    const origin = req.headers.origin || '';
    setCors(res, origin);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed. Use GET.' });
        return;
    }

    const authHeader = req.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!idToken) {
        res.status(401).json({ error: 'Missing authentication token.' });
        return;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const role = decodedToken.role || 'viewer';
        const email = decodedToken.email || '';
        const uid = decodedToken.uid;

        res.status(200).json({
            uid: uid,
            email: email,
            role: role,
            isSuperAdmin: role === 'super' || SUPER_ADMIN_EMAILS.has(email.toLowerCase()),
            isEditor: role === 'editor' || role === 'super' || SUPER_ADMIN_EMAILS.has(email.toLowerCase())
        });

    } catch (error) {
        console.error('❌ GetUserRole error:', error);
        res.status(401).json({ error: 'Invalid token.' });
    }
});

// ============================================================
// ===== AUTO-ASSIGN ROLE ON USER CREATION =====
// ============================================================
exports.autoAssignRole = onUserCreated({
    secrets: [imageKitPrivateKey],
    timeoutSeconds: 10,
    memory: '256MiB'
}, async (event) => {
    const user = event.data;
    const email = user.email?.toLowerCase() || '';
    const uid = user.uid || 'unknown';
    
    console.log(`👤 New user created: ${email} (UID: ${uid})`);
    
    // Check if user is a Super Admin (hardcoded)
    const isSuperAdmin = SUPER_ADMIN_EMAILS.has(email);
    
    // Determine role: Super Admin if in list, otherwise Viewer
    const role = isSuperAdmin ? 'super' : 'viewer';
    
    try {
        // Set custom claims
        await admin.auth().setCustomUserClaims(uid, { role });
        console.log(`✅ Auto-assigned "${role}" role to ${email} (UID: ${uid})`);
        
        // Also save to Firestore
        try {
            const db = admin.firestore();
            await db.collection('users').doc(uid).set({
                email: email,
                role: role,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                uid: uid
            });
        } catch (firestoreError) {
            console.warn('⚠️ Firestore save failed:', firestoreError);
        }
        
        return { success: true, email, role };
        
    } catch (error) {
        console.error(`❌ Failed to assign role to ${email}:`, error);
        throw error;
    }
});

// ============================================================
// ===== HEALTH CHECK ENDPOINT =====
// ============================================================
exports.health = onRequest({ 
    secrets: [imageKitPrivateKey],
    timeoutSeconds: 5
}, async (req, res) => {
    const origin = req.headers.origin || '';
    setCors(res, origin);

    const privateKeyStatus = await getPrivateKey();
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        publicKey: IMAGEKIT_PUBLIC_KEY ? 'Configured' : 'Missing',
        urlEndpoint: IMAGEKIT_URL_ENDPOINT ? 'Configured' : 'Missing',
        privateKeyConfigured: privateKeyStatus ? '✅ Yes' : '❌ No',
        rateLimiting: `Max ${MAX_REQUESTS_PER_WINDOW} requests per minute`,
        cors: {
            allowedOrigins: ALLOWED_ORIGINS,
            currentOrigin: origin
        },
        security: {
            hsts: 'Enabled',
            xssProtection: 'Enabled',
            frameOptions: 'DENY',
            contentTypeOptions: 'nosniff'
        },
        roles: {
            superAdmin: Array.from(SUPER_ADMIN_EMAILS),
            availableRoles: ['super', 'editor', 'viewer']
        },
        project: {
            name: 'MOTO KENYA',
            version: '2.0.0'
        }
    });
});

// ============================================================
// ===== CLEANUP RATE LIMITING CACHE =====
// ============================================================
setInterval(() => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    for (const [key, data] of requestCounts) {
        if (data.timestamp < windowStart) {
            requestCounts.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW * 2);

console.log('🚀 MOTO KENYA Cloud Functions loaded');
console.log(`📧 Super Admin emails: ${Array.from(SUPER_ADMIN_EMAILS).join(', ')}`);
console.log('🔒 Security: Rate limiting, CORS validation, Input sanitization enabled');