@echo off
echo Stopping AI Chat Orchestrator servers...
echo.

:: First attempt: Kill by window title
echo Attempting to kill processes by window title...
taskkill /f /im python.exe /fi "WINDOWTITLE eq AI Chat Backend*"
taskkill /f /im node.exe /fi "WINDOWTITLE eq AI Chat Frontend*"

:: Second attempt: Kill all Python and Node processes (be careful with this!)
echo.
echo If servers are still running, we can try a more aggressive approach.
echo.
echo WARNING: This will kill ALL Python and Node.js processes!
echo Press Ctrl+C to abort or any other key to continue...
pause

:: Kill Python processes (backend)
echo Killing Python processes (backend)...
taskkill /f /im python.exe

:: Kill Node.js processes (frontend)
echo Killing Node.js processes (frontend)...
taskkill /f /im node.exe

echo.
echo All servers have been stopped.
pause