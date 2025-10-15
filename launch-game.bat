@echo off
echo Starting Word Card Game Server...

REM Navigate to the project directory
cd /d "j:\Git\personal\word-card-game"

REM Start the Vite development server in a new command prompt window
echo Starting Vite server (npm run dev)...
start "Word Card Game Server" npm run dev

REM Wait a few seconds for the server to initialize
echo Waiting for server to start (e.g., 4 seconds)...
timeout /t 4 /nobreak > nul

REM Open the game in the default web browser
REM Make sure this URL matches the one Vite uses)
echo Launching game in browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo The Word Card Game server is running in a separate window.
echo To stop the server, close that new command prompt window or press Ctrl+C in it.
