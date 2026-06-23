# Start the local ImageKit auth server using a .env file for secrets.
# Keep private keys out of source control.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if (-not [string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith('#')) {
            $parts = $line -split '=', 2
            if ($parts.Length -eq 2) {
                $name = $parts[0].Trim()
                $value = $parts[1].Trim().Trim("'", '"')
                if ($name -and $value) {
                    Set-Item -Path "Env:$name" -Value $value
                }
            }
        }
    }
}

if (-not $env:IMAGEKIT_PRIVATE_KEY) {
    Write-Host 'ERROR: IMAGEKIT_PRIVATE_KEY is not set.' -ForegroundColor Red
    Write-Host 'Create a .env file based on .env.example and set IMAGEKIT_PRIVATE_KEY there.'
    exit 1
}

Write-Host "Starting ImageKit auth server on port ${env:PORT:-3000}." -ForegroundColor Green
Write-Host "IMAGEKIT_PRIVATE_KEY is loaded from .env and will not be exposed to the browser." -ForegroundColor Green

node .\imagekit-auth-server.js
