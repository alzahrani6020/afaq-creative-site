# Deploy afaq-creative to Vercel production (run after: npx vercel login)
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "package.json")) { throw "Run from afaq-creative tree" }
Write-Host "Deploying afaq-creative to Vercel production..."
npx --yes vercel@latest --prod --yes
