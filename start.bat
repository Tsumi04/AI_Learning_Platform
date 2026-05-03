@echo off
REM ══════════════════════════════════════════
REM   NEUROVAULT — Windows Startup Script
REM   Starts all 3 servers concurrently
REM ══════════════════════════════════════════

echo.
echo  ========================================
echo   NEUROVAULT AI Learning Platform
echo   Starting all services...
echo  ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)

REM Check Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "backend\server\node_modules" (
    echo [SETUP] Installing backend dependencies...
    cd backend\server
    npm install
    cd ..\..
)

if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo [1/3] Starting Backend (API Gateway) on port 5000...
start "NeuroVault Backend" cmd /c "cd backend\server && npm run dev"

echo [2/3] Starting AI Core (Python FastAPI) on port 8000...
start "NeuroVault AI Core" cmd /c "cd backend\ai_core && python api\ai_server.py"

echo [3/3] Starting Frontend (Vite) on port 5173...
start "NeuroVault Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo  ========================================
echo   All services started!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   AI Core:   http://localhost:8000
echo  ========================================
echo.
echo Press any key to stop all services...
pause >nul

REM Kill all started processes
taskkill /FI "WindowTitle eq NeuroVault*" /F >nul 2>&1
echo Services stopped.
