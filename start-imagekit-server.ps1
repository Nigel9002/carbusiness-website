$ErrorActionPreference = "Stop"

Write-Host "🔍 Checking environment configuration..." -ForegroundColor Cyan

# ============================================================
# 1. CHECK .env FILE EXISTS
# ============================================================
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "   Please create a .env file based on .env.example" -ForegroundColor Yellow
    Write-Host "   and fill in your ImageKit credentials." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# ============================================================
# 2. LOAD .env FILE
# ============================================================
Write-Host "📖 Loading environment variables..." -ForegroundColor Cyan

Get-Content ".env" | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -notmatch "=") {
        return
    }

    $name, $value = $_ -split "=", 2
    $name = $name.Trim()
    $value = $value.Trim()

    if ($name -and -not [Environment]::GetEnvironmentVariable($name, "Process")) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# ============================================================
# 3. VALIDATE IMAGEKIT PUBLIC KEY
# ============================================================
$publicKey = $env:IMAGEKIT_PUBLIC_KEY
if (-not $publicKey) {
    Write-Host "❌ ERROR: IMAGEKIT_PUBLIC_KEY is not set in .env" -ForegroundColor Red
    Write-Host "   Please add IMAGEKIT_PUBLIC_KEY=your_public_key to .env" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://imagekit.io/dashboard" -ForegroundColor Yellow
    exit 1
}

$publicKey = $publicKey.Trim()
if ($publicKey.Contains("your_public_key") -or $publicKey.Contains("*") -or $publicKey.Length -lt 10) {
    Write-Host "❌ ERROR: IMAGEKIT_PUBLIC_KEY is invalid or using placeholder" -ForegroundColor Red
    Write-Host "   Current value: $publicKey" -ForegroundColor Yellow
    Write-Host "   Please use your real public key from ImageKit dashboard" -ForegroundColor Yellow
    exit 1
}

if (-not $publicKey.StartsWith("public_")) {
    Write-Host "⚠️ WARNING: IMAGEKIT_PUBLIC_KEY does not start with 'public_'" -ForegroundColor Yellow
    Write-Host "   This may indicate an invalid key format" -ForegroundColor Yellow
}

Write-Host "✅ IMAGEKIT_PUBLIC_KEY validated" -ForegroundColor Green

# ============================================================
# 4. VALIDATE IMAGEKIT PRIVATE KEY
# ============================================================
$privateKey = $env:IMAGEKIT_PRIVATE_KEY
if (-not $privateKey) {
    Write-Host "❌ ERROR: IMAGEKIT_PRIVATE_KEY is not set in .env" -ForegroundColor Red
    Write-Host "   Please add IMAGEKIT_PRIVATE_KEY=your_private_key to .env" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://imagekit.io/dashboard" -ForegroundColor Yellow
    exit 1
}

$privateKey = $privateKey.Trim()
if ($privateKey.Contains("your_private_key") -or $privateKey.Contains("*") -or $privateKey.Length -lt 10) {
    Write-Host "❌ ERROR: IMAGEKIT_PRIVATE_KEY is invalid or using placeholder" -ForegroundColor Red
    Write-Host "   Current value: $privateKey" -ForegroundColor Yellow
    Write-Host "   Please use your real private key from ImageKit dashboard" -ForegroundColor Yellow
    exit 1
}

if (-not $privateKey.StartsWith("private_")) {
    Write-Host "⚠️ WARNING: IMAGEKIT_PRIVATE_KEY does not start with 'private_'" -ForegroundColor Yellow
    Write-Host "   This may indicate an invalid key format" -ForegroundColor Yellow
}

Write-Host "✅ IMAGEKIT_PRIVATE_KEY validated" -ForegroundColor Green

# ============================================================
# 5. VALIDATE IMAGEKIT URL ENDPOINT
# ============================================================
$urlEndpoint = $env:IMAGEKIT_URL_ENDPOINT
if (-not $urlEndpoint) {
    Write-Host "❌ ERROR: IMAGEKIT_URL_ENDPOINT is not set in .env" -ForegroundColor Red
    Write-Host "   Please add IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id to .env" -ForegroundColor Yellow
    Write-Host "   Get your URL endpoint from: https://imagekit.io/dashboard" -ForegroundColor Yellow
    exit 1
}

$urlEndpoint = $urlEndpoint.Trim()
if ($urlEndpoint.Contains("your_imagekit_id") -or -not $urlEndpoint.StartsWith("https://ik.imagekit.io/")) {
    Write-Host "❌ ERROR: IMAGEKIT_URL_ENDPOINT is invalid or using placeholder" -ForegroundColor Red
    Write-Host "   Current value: $urlEndpoint" -ForegroundColor Yellow
    Write-Host "   Please use your real URL endpoint from ImageKit dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ IMAGEKIT_URL_ENDPOINT validated" -ForegroundColor Green

# ============================================================
# 6. VALIDATE SUPER ADMIN EMAILS (Optional but recommended)
# ============================================================
$superAdmins = $env:SUPER_ADMIN_EMAILS
if (-not $superAdmins) {
    Write-Host "⚠️ WARNING: SUPER_ADMIN_EMAILS is not set in .env" -ForegroundColor Yellow
    Write-Host "   You won't be able to assign admin roles without this." -ForegroundColor Yellow
    Write-Host "   Add SUPER_ADMIN_EMAILS=email1@example.com,email2@example.com to .env" -ForegroundColor Yellow
} else {
    Write-Host "✅ SUPER_ADMIN_EMAILS: $superAdmins" -ForegroundColor Green
}

# ============================================================
# 7. LOAD SERVER CONFIGURATION
# ============================================================
$port = $env:PORT
if (-not $port) {
    $port = 3000
    Write-Host "⚠️ PORT not set in .env, using default: $port" -ForegroundColor Yellow
} else {
    Write-Host "✅ PORT: $port" -ForegroundColor Green
}

$nodeEnv = $env:NODE_ENV
if (-not $nodeEnv) {
    $nodeEnv = "development"
    Write-Host "⚠️ NODE_ENV not set in .env, using default: $nodeEnv" -ForegroundColor Yellow
} else {
    Write-Host "✅ NODE_ENV: $nodeEnv" -ForegroundColor Green
}

$root = (Get-Location).Path

# ============================================================
# 8. CHECK NODE.JS IS INSTALLED
# ============================================================
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# 9. CHECK imagekit-auth-server.js EXISTS
# ============================================================
if (-not (Test-Path "imagekit-auth-server.js")) {
    Write-Host "❌ ERROR: imagekit-auth-server.js not found!" -ForegroundColor Red
    Write-Host "   Please ensure imagekit-auth-server.js is in the root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ imagekit-auth-server.js found" -ForegroundColor Green

# ============================================================
# 10. START SERVER
# ============================================================
Write-Host ""
Write-Host "=" * 70
Write-Host "🚀 MOTO KENYA - Starting Server..." -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host "📍 Server URL: http://localhost:$port"
Write-Host "📁 Root: $root"
Write-Host "🔧 Environment: $nodeEnv"
Write-Host "=" * 70
Write-Host "🔑 ImageKit Configuration:" -ForegroundColor Cyan
Write-Host "   🔗 URL Endpoint: $urlEndpoint"
Write-Host "   🔑 Public Key: Configured ✅"
Write-Host "   🔒 Private Key: Configured ✅"
Write-Host "=" * 70
Write-Host "📄 Available Endpoints:" -ForegroundColor Cyan
Write-Host "   🔑 Auth: http://localhost:$port/imagekit-auth"
Write-Host "   💚 Health: http://localhost:$port/health"
Write-Host "   📄 Admin: http://localhost:$port/admin.html"
Write-Host "   🏠 Home: http://localhost:$port/"
Write-Host "=" * 70
Write-Host ""
Write-Host "✅ All checks passed! Starting server..." -ForegroundColor Green
Write-Host "📋 Press Ctrl+C to stop the server"
Write-Host ""

# Run the Node.js server
node .\imagekit-auth-server.js