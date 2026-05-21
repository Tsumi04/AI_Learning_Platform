#!/usr/bin/env pwsh
# ══════════════════════════════════════════════
#  NEUROVAULT — Development Startup Script (PowerShell)
#  Khởi động tất cả services trong terminal riêng biệt
# ══════════════════════════════════════════════

$ErrorActionPreference = 'Continue'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║         🧠 NEUROVAULT DEV LAUNCHER           ║" -ForegroundColor Cyan
Write-Host "  ║         Starting all services...              ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Ollama ──
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaPath) {
    Write-Host "[1/4] 🚀 Khởi động Ollama..." -ForegroundColor Green
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Normal
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/4] ⚠️  Ollama không tìm thấy — LLM features sẽ offline." -ForegroundColor Yellow
}

# ── 2. AI Core ──
$pythonPath = Get-Command python -ErrorAction SilentlyContinue
if ($pythonPath) {
    Write-Host "[2/4] 🐍 Khởi động AI Core (FastAPI port 8000)..." -ForegroundColor Green
    Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$scriptDir\backend\ai_core`" && python api/ai_server.py" -WindowStyle Normal
    Start-Sleep -Seconds 3
} else {
    Write-Host "[2/4] ❌ Python không tìm thấy — AI Core sẽ không hoạt động." -ForegroundColor Red
}

# ── 3. Backend Gateway ──
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    Write-Host "[3/4] 🟢 Khởi động Backend Gateway (Express port 5001)..." -ForegroundColor Green
    Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$scriptDir\backend\server`" && node index.js" -WindowStyle Normal
    Start-Sleep -Seconds 2
} else {
    Write-Host "[3/4] ❌ Node.js không tìm thấy!" -ForegroundColor Red
    exit 1
}

# ── 4. Frontend ──
Write-Host "[4/4] ⚛️  Khởi động Frontend (Vite port 5173)..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$scriptDir\frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  ✅ Tất cả services đã khởi động!            ║" -ForegroundColor Green
Write-Host "  ║                                              ║" -ForegroundColor Green
Write-Host "  ║  Ollama:    http://127.0.0.1:11434           ║" -ForegroundColor Green
Write-Host "  ║  AI Core:   http://127.0.0.1:8000            ║" -ForegroundColor Green
Write-Host "  ║  Backend:   http://127.0.0.1:5001            ║" -ForegroundColor Green
Write-Host "  ║  Frontend:  http://localhost:5173             ║" -ForegroundColor Green
Write-Host "  ║                                              ║" -ForegroundColor Green
Write-Host "  ║  Health:    http://localhost:5001/api/health  ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Tự động mở browser
Start-Process "http://localhost:5173"

Write-Host "  Browser đã mở. Nhấn Enter để đóng launcher..." -ForegroundColor DarkGray
Read-Host
