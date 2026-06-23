$ErrorActionPreference = "Stop"

if (Test-Path ".env") {
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
}

if (-not $env:IMAGEKIT_PRIVATE_KEY) {
    $env:IMAGEKIT_PRIVATE_KEY = Read-Host "Enter your full ImageKit private key"
}

$privateKey = $env:IMAGEKIT_PRIVATE_KEY.Trim()
if ($privateKey.Contains("*")) {
    throw "IMAGEKIT_PRIVATE_KEY still looks masked. Use the full private key from ImageKit."
}

$root = (Get-Location).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:3000/")

function Write-Response {
    param(
        [System.Net.HttpListenerResponse] $Response,
        [int] $StatusCode,
        [string] $Body,
        [string] $ContentType = "application/json; charset=utf-8"
    )

    $Response.StatusCode = $StatusCode
    $Response.ContentType = $ContentType
    $Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $Response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type")
    $Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $Response.Close()
}

function Get-ImageKitSignature {
    param([string] $PrivateKey)

    $token = [guid]::NewGuid().ToString()
    $expire = [int][double]::Parse((Get-Date -UFormat %s)) + 600
    $payload = "$token$expire"
    $keyBytes = [System.Text.Encoding]::UTF8.GetBytes($PrivateKey)
    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $hmac = [System.Security.Cryptography.HMACSHA1]::new($keyBytes)
    $hashBytes = $hmac.ComputeHash($payloadBytes)
    $signature = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })

    return @{
        token = $token
        expire = $expire
        signature = $signature
    } | ConvertTo-Json -Compress
}

function Get-ContentType {
    param([string] $Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8" }
        ".css" { "text/css; charset=utf-8" }
        ".js" { "text/javascript; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".png" { "image/png" }
        ".jpg" { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".webp" { "image/webp" }
        default { "application/octet-stream" }
    }
}

function Send-File {
    param(
        [System.Net.HttpListenerResponse] $Response,
        [string] $UrlPath
    )

    if ($UrlPath -eq "/") {
        $UrlPath = "/index.html"
    }

    $relativePath = $UrlPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))

    if (-not $filePath.StartsWith($root)) {
        Write-Response $Response 403 "Forbidden" "text/plain; charset=utf-8"
        return
    }

    if (-not (Test-Path $filePath -PathType Leaf)) {
        Write-Response $Response 404 "Not found" "text/plain; charset=utf-8"
        return
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $Response.StatusCode = 200
    $Response.ContentType = Get-ContentType $filePath
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $Response.Close()
}

$listener.Start()
Write-Host "Car website running at http://localhost:3000"
Write-Host "Open http://localhost:3000/admin.html to upload vehicles."
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath

        if ($request.HttpMethod -eq "OPTIONS") {
            Write-Response $response 204 ""
            continue
        }

        if ($request.HttpMethod -eq "GET" -and $path -eq "/imagekit-auth") {
            Write-Response $response 200 (Get-ImageKitSignature $privateKey)
            continue
        }

        if ($request.HttpMethod -eq "GET") {
            Send-File $response $path
            continue
        }

        Write-Response $response 405 "Method not allowed" "text/plain; charset=utf-8"
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
