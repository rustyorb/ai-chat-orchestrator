@echo off
echo Starting AI Chat Orchestrator...
echo.

:: Start the backend server in a new window
start "AI Chat Backend" cmd /c "cd backend && python main.py"

:: Wait a moment for backend to initialize
timeout /t 3

:: Start the frontend dev server in a new window
start "AI Chat Frontend" cmd /c "npm run dev"

echo.
echo Servers started! Close this window to keep servers running.
echo Use stop-app.bat to shut down all servers when done.