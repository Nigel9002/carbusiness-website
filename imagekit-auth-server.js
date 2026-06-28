// ================================================================
// MOTO KENYA - ImageKit Authentication Server (FIXED - CSP ENABLED)
// ================================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ================================================================
// ===== CONFIGURATION =====
// ================================================================

// ImageKit credentials - MUST come from .env ONLY
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;

// Validate required keys
if (!IMAGEKIT_PUBLIC_KEY || IMAGEKIT_PUBLIC_KEY.includes('your_public_key') || IMAGEKIT_PUBLIC_KEY.length < 10) {
    console.error('❌ ERROR: IMAGEKIT_PUBLIC_KEY is not set or invalid in .env');
    console.error('   Please check your .env file and ensure IMAGEKIT_PUBLIC_KEY is correctly set.');
    process.exit(1);
}

if (!IMAGEKIT_PRIVATE_KEY || IMAGEKIT_PRIVATE_KEY.includes('your_private_key') || IMAGEKIT_PRIVATE_KEY.length < 10) {
    console.error('❌ ERROR: IMAGEKIT_PRIVATE_KEY is not set or invalid in .env');
    console.error('   Please check your .env file and ensure IMAGEKIT_PRIVATE_KEY is correctly set.');
    process.exit(1);
}

if (!IMAGEKIT_URL_ENDPOINT || IMAGEKIT_URL_ENDPOINT.includes('your_imagekit_id') || !IMAGEKIT_URL_ENDPOINT.startsWith('https://ik.imagekit.io/')) {
    console.error('❌ ERROR: IMAGEKIT_URL_ENDPOINT is not set or invalid in .env');
    console.error('   Please check your .env file and ensure IMAGEKIT_URL_ENDPOINT is correctly set.');
    process.exit(1);
}

// CORS allowed origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://nige19002.github.io',
        'https://nige19002.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'https://caradds-227e9.web.app',
        'https://caradds-227e9.firebaseapp.com'
    ];

// Rate limiting
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30;

// Admin rate limiting (stricter)
const ADMIN_RATE_LIMIT_WINDOW = parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS) || 60000;
const ADMIN_RATE_LIMIT_MAX = parseInt(process.env.ADMIN_RATE_LIMIT_MAX_REQUESTS) || 10;

// ================================================================
// ===== SECURITY MIDDLEWARE - CSP FULLY CONFIGURED =====
// ================================================================

// Helmet with properly configured CSP to allow ImageKit SDK
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'",
                "'unsafe-hashes'",
                "https://www.gstatic.com", 
                "https://*.firebaseio.com", 
                "https://*.googleapis.com", 
                "https://*.firebaseapp.com",
                "https://sdk.imagekit.io",
                "https://cdnjs.cloudflare.com",
                "https://ik.imagekit.io",
                "https://www.googletagmanager.com",
                "https://unpkg.com"
            ],
            scriptSrcElem: [
                "'self'", 
                "'unsafe-inline'",
                "'unsafe-hashes'",
                "https://www.gstatic.com", 
                "https://*.firebaseio.com", 
                "https://*.googleapis.com", 
                "https://*.firebaseapp.com",
                "https://sdk.imagekit.io",
                "https://cdnjs.cloudflare.com",
                "https://ik.imagekit.io",
                "https://www.googletagmanager.com",
                "https://unpkg.com"
            ],
            scriptSrcAttr: [
                "'unsafe-inline'"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com", 
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "https://fonts.gstatic.com", 
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: [
                "*", 
                "data:", 
                "blob:",
                "https://ik.imagekit.io",
                "https://*.ik.imagekit.io",
                "https://ik.imagekit.io/*",
                "https://via.placeholder.com", 
                "https://images.unsplash.com"
            ],
            connectSrc: [
                "*", 
                "https://*.firebaseio.com", 
                "https://*.googleapis.com", 
                "https://*.firebaseapp.com", 
                "https://upload.imagekit.io", 
                "https://us-central1-caradds-227e9.cloudfunctions.net",
                "https://ik.imagekit.io",
                "https://*.ik.imagekit.io",
                "https://sdk.imagekit.io",
                "https://cdnjs.cloudflare.com"
            ],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        },
        reportOnly: false
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    xFrameOptions: 'DENY',
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
        directives: {
            geolocation: ["'self'"],
            microphone: ["'none'"],
            camera: ["'none'"],
            payment: ["'none'"]
        }
    }
}));

// CORS with origin validation
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 204
}));

// Rate limiting for auth endpoints
const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/imagekit-auth', limiter);
app.use('/api/', limiter);

// Stricter rate limiting for admin endpoints
const adminLimiter = rateLimit({
    windowMs: ADMIN_RATE_LIMIT_WINDOW,
    max: ADMIN_RATE_LIMIT_MAX,
    message: {
        error: 'Too many admin requests. Please try again later.',
        retryAfter: Math.ceil(ADMIN_RATE_LIMIT_WINDOW / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/admin', adminLimiter);

// JSON and URL encoded parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================================================
// ===== LOGGING MIDDLEWARE =====
// ================================================================
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleString();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    console.log(`[${timestamp}] 📝 ${req.method} ${req.url} - IP: ${ip}`);
    next();
});

// ================================================================
// ===== SERVE STATIC FILES =====
// ================================================================

app.use(express.static(__dirname));

app.use('/pages', express.static(path.join(__dirname, 'pages'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

app.use('/css', express.static(path.join(__dirname, 'css'), {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

app.use('/js', express.static(path.join(__dirname, 'js'), {
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// ================================================================
// ===== ROOT ROUTE =====
// ================================================================
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.redirect('/index.html');
    } else {
        res.json({
            name: 'MOTO KENYA - Vehicle Management API',
            version: '3.0.0',
            status: 'running',
            endpoints: {
                admin: '/admin.html',
                'admin-pages': '/pages/admin.html',
                index: '/index.html',
                auth: '/imagekit-auth',
                health: '/health',
                'api-health': '/api/health',
                structure: '/test-structure'
            },
            projectStructure: {
                root: __dirname,
                pages: fs.existsSync(path.join(__dirname, 'pages')) ? '✅ Found' : '❌ Missing',
                css: fs.existsSync(path.join(__dirname, 'css')) ? '✅ Found' : '❌ Missing',
                js: fs.existsSync(path.join(__dirname, 'js')) ? '✅ Found' : '❌ Missing',
                images: fs.existsSync(path.join(__dirname, 'images')) ? '✅ Found' : '❌ Missing'
            },
            security: {
                cors: ALLOWED_ORIGINS,
                rateLimit: `${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW/1000} seconds`,
                adminRateLimit: `${ADMIN_RATE_LIMIT_MAX} requests per ${ADMIN_RATE_LIMIT_WINDOW/1000} seconds`,
                helmet: '✅ Enabled (CSP fixed for ImageKit)'
            }
        });
    }
});

// ================================================================
// ===== SERVE HTML FILES WITH NO CACHE =====
// ================================================================

function serveHtml(filePath, res, pageName) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ${pageName} not found!`);
        return res.status(404).json({ 
            error: 'Not Found',
            message: `${pageName} not found`
        });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    console.log(`📄 Serving ${pageName} (fresh copy)`);
    console.log(`   📁 File path: ${filePath}`);
    console.log(`   📦 File size: ${fileContent.length} bytes`);
    console.log(`   📅 Modified: ${fs.statSync(filePath).mtime.toLocaleString()}`);
    
    res.send(fileContent);
}

app.get('/admin.html', (req, res) => {
    let filePath = path.join(__dirname, 'admin.html');
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'pages', 'admin.html');
    }
    serveHtml(filePath, res, 'admin.html');
});

app.get('/pages/admin.html', (req, res) => {
    const filePath = path.join(__dirname, 'pages', 'admin.html');
    serveHtml(filePath, res, 'pages/admin.html');
});

app.get('/index.html', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    serveHtml(filePath, res, 'index.html');
});

app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    if (!page.endsWith('.html')) {
        return res.status(404).json({ error: 'Not Found' });
    }
    const filePath = path.join(__dirname, 'pages', page);
    serveHtml(filePath, res, `pages/${page}`);
});

app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (['imagekit-auth', 'health', 'api', 'test-structure', 'admin', 'index'].includes(page)) {
        return next();
    }
    if (!page.endsWith('.html')) {
        const filePath = path.join(__dirname, 'pages', `${page}.html`);
        if (fs.existsSync(filePath)) {
            return serveHtml(filePath, res, `${page}.html`);
        }
        const rootPath = path.join(__dirname, `${page}.html`);
        if (fs.existsSync(rootPath)) {
            return serveHtml(rootPath, res, `${page}.html`);
        }
    }
    next();
});

// ================================================================
// ===== IMAGEKIT AUTH ENDPOINT =====
// ================================================================
app.get('/imagekit-auth', (req, res) => {
    console.log('🔑 ImageKit auth requested');
    
    // Keys are already validated at startup - use them directly
    const privateKey = IMAGEKIT_PRIVATE_KEY;
    const publicKey = IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = IMAGEKIT_URL_ENDPOINT;

    try {
        const token = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 10 * 60;
        const signature = crypto
            .createHmac('sha1', privateKey)
            .update(token + expire)
            .digest('hex');

        const response = {
            token: token,
            expire: expire,
            signature: signature,
            publicKey: publicKey,
            urlEndpoint: urlEndpoint
        };

        console.log('✅ Auth generated successfully');
        console.log(`   🔑 Token: ${token.substring(0, 8)}...`);
        console.log(`   ⏱️  Expire: ${new Date(expire * 1000).toLocaleString()}`);
        console.log(`   📝 Signature: ${signature.substring(0, 8)}...`);

        res.json(response);

    } catch (error) {
        console.error('❌ Error generating auth:', error);
        res.status(500).json({ 
            error: 'Failed to generate authentication parameters',
            details: error.message 
        });
    }
});

// ================================================================
// ===== HEALTH CHECK =====
// ================================================================
app.get('/health', (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        server: {
            name: 'MOTO KENYA - ImageKit Auth Server',
            version: '3.0.0',
            port: PORT
        },
        keys: {
            publicKey: IMAGEKIT_PUBLIC_KEY ? '✅ Configured' : '❌ Missing',
            privateKey: IMAGEKIT_PRIVATE_KEY ? '✅ Configured' : '❌ Missing',
            urlEndpoint: IMAGEKIT_URL_ENDPOINT ? '✅ Configured' : '❌ Missing'
        },
        security: {
            cors: ALLOWED_ORIGINS,
            rateLimit: `${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW/1000} seconds`,
            adminRateLimit: `${ADMIN_RATE_LIMIT_MAX} requests per ${ADMIN_RATE_LIMIT_WINDOW/1000} seconds`,
            helmet: '✅ Enabled (CSP fixed)'
        },
        projectStructure: {
            root: __dirname,
            pages: fs.existsSync(path.join(__dirname, 'pages')) ? '✅ Found' : '❌ Missing',
            css: fs.existsSync(path.join(__dirname, 'css')) ? '✅ Found' : '❌ Missing',
            js: fs.existsSync(path.join(__dirname, 'js')) ? '✅ Found' : '❌ Missing',
            images: fs.existsSync(path.join(__dirname, 'images')) ? '✅ Found' : '❌ Missing'
        }
    };
    
    console.log('💚 Health check requested');
    res.json(healthCheck);
});

// ================================================================
// ===== API HEALTH CHECK =====
// ================================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        server: 'ImageKit Auth Server',
        port: PORT,
        publicKey: IMAGEKIT_PUBLIC_KEY ? '✅ Configured' : '❌ Missing',
        urlEndpoint: IMAGEKIT_URL_ENDPOINT ? '✅ Configured' : '❌ Missing',
        privateKey: IMAGEKIT_PRIVATE_KEY ? '✅ Configured' : '❌ Missing'
    });
});

// ================================================================
// ===== TEST STRUCTURE ENDPOINT =====
// ================================================================
app.get('/test-structure', (req, res) => {
    const pagesDir = path.join(__dirname, 'pages');
    const cssDir = path.join(__dirname, 'css');
    const jsDir = path.join(__dirname, 'js');
    const imagesDir = path.join(__dirname, 'images');
    
    const testResults = {
        timestamp: new Date().toISOString(),
        root: __dirname,
        files: {
            'index.html': fs.existsSync(path.join(__dirname, 'index.html')),
            'admin.html': fs.existsSync(path.join(__dirname, 'admin.html')),
            'package.json': fs.existsSync(path.join(__dirname, 'package.json'))
        },
        folders: {
            'pages': {
                exists: fs.existsSync(pagesDir),
                files: fs.existsSync(pagesDir) ? 
                    fs.readdirSync(pagesDir).filter(f => f.endsWith('.html')) : []
            },
            'css': {
                exists: fs.existsSync(cssDir),
                files: fs.existsSync(cssDir) ? 
                    fs.readdirSync(cssDir).filter(f => f.endsWith('.css')) : []
            },
            'js': {
                exists: fs.existsSync(jsDir),
                files: fs.existsSync(jsDir) ? 
                    fs.readdirSync(jsDir).filter(f => f.endsWith('.js')) : []
            },
            'images': {
                exists: fs.existsSync(imagesDir)
            }
        },
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            env: process.env.NODE_ENV || 'development'
        }
    };
    
    console.log('🔍 Project structure test requested');
    res.json(testResults);
});

// ================================================================
// ===== 404 HANDLER =====
// ================================================================
app.use((req, res) => {
    console.log(`⚠️ 404: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'Not Found',
        message: `The requested resource "${req.url}" was not found`,
        timestamp: new Date().toISOString()
    });
});

// ================================================================
// ===== ERROR HANDLER =====
// ================================================================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// ================================================================
// ===== START SERVER =====
// ================================================================
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 MOTO KENYA - ImageKit Auth Server Started (SECURE VERSION)');
    console.log('='.repeat(70));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📁 Root: ${__dirname}`);
    console.log('='.repeat(70));
    console.log('📄 Available Endpoints:');
    console.log(`   🏠 Home: http://localhost:${PORT}/`);
    console.log(`   📄 Index: http://localhost:${PORT}/index.html`);
    console.log(`   📄 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`   📄 Pages Admin: http://localhost:${PORT}/pages/admin.html`);
    console.log(`   🔑 Auth: http://localhost:${PORT}/imagekit-auth`);
    console.log(`   💚 Health: http://localhost:${PORT}/health`);
    console.log(`   💚 API Health: http://localhost:${PORT}/api/health`);
    console.log(`   🔍 Test Structure: http://localhost:${PORT}/test-structure`);
    console.log('='.repeat(70));
    console.log('🔑 ImageKit Configuration:');
    console.log(`   🔗 URL Endpoint: ${IMAGEKIT_URL_ENDPOINT}`);
    console.log(`   🔑 Public Key: ${IMAGEKIT_PUBLIC_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   🔒 Private Key: ${IMAGEKIT_PRIVATE_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log('='.repeat(70));
    console.log('🛡️ Security Configuration:');
    console.log(`   🌐 CORS Allowed Origins: ${ALLOWED_ORIGINS.length} origins`);
    console.log(`   ⏱️ Rate Limit: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW/1000} seconds`);
    console.log(`   ⏱️ Admin Rate Limit: ${ADMIN_RATE_LIMIT_MAX} requests per ${ADMIN_RATE_LIMIT_WINDOW/1000} seconds`);
    console.log(`   🛡️ Helmet: Enabled (CSP fixed for ImageKit)`);
    console.log('='.repeat(70));
    
    console.log('\n📁 Project Structure Check:');
    console.log(`   📂 Pages: ${fs.existsSync(path.join(__dirname, 'pages')) ? '✅ Found' : '❌ Missing'}`);
    console.log(`   📂 CSS: ${fs.existsSync(path.join(__dirname, 'css')) ? '✅ Found' : '❌ Missing'}`);
    console.log(`   📂 JS: ${fs.existsSync(path.join(__dirname, 'js')) ? '✅ Found' : '❌ Missing'}`);
    console.log(`   📂 Images: ${fs.existsSync(path.join(__dirname, 'images')) ? '✅ Found' : '❌ Missing'}`);
    
    if (fs.existsSync(path.join(__dirname, 'pages'))) {
        const htmlFiles = fs.readdirSync(path.join(__dirname, 'pages')).filter(f => f.endsWith('.html'));
        console.log(`   📄 Pages HTML files: ${htmlFiles.length} (${htmlFiles.join(', ')})`);
    }
    if (fs.existsSync(path.join(__dirname, 'css'))) {
        const cssFiles = fs.readdirSync(path.join(__dirname, 'css'));
        console.log(`   🎨 CSS files: ${cssFiles.length} (${cssFiles.join(', ')})`);
    }
    if (fs.existsSync(path.join(__dirname, 'js'))) {
        const jsFiles = fs.readdirSync(path.join(__dirname, 'js'));
        console.log(`   📜 JS files: ${jsFiles.length} (${jsFiles.join(', ')})`);
    }
    
    console.log('='.repeat(70));
    console.log('\n✅ Server is ready to handle requests!');
    console.log('📋 Press Ctrl+C to stop the server\n');
});

// ================================================================
// ===== GRACEFUL SHUTDOWN =====
// ================================================================
const shutdown = () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection:', reason);
    shutdown();
});