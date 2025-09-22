@echo off
echo -------------------------------------------
echo Redis Setup Guide for Windows Development
echo -------------------------------------------
echo.
echo This script will guide you through setting up Redis for local development.
echo.
echo Steps to install Redis on Windows:
echo 1. Install Redis using Windows Subsystem for Linux (WSL) or
echo 2. Use Docker to run Redis (recommended) or
echo 3. Use Redis Labs free cloud service with new credentials
echo.
echo Option 1: Install Redis using WSL
echo --------------------------------
echo 1. Enable WSL by running this command as administrator:
echo    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
echo 2. Install Ubuntu from Microsoft Store
echo 3. Open Ubuntu and run:
echo    sudo apt update
echo    sudo apt install redis-server
echo 4. Start Redis:
echo    sudo service redis-server start
echo.
echo Option 2: Use Docker (Recommended)
echo --------------------------------
echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
echo 2. Start Docker Desktop
echo 3. Run Redis container with this command:
echo    docker run --name redis-local -p 6379:6379 -d redis
echo.
echo Option 3: Create a new Redis Labs account
echo --------------------------------
echo 1. Go to https://redis.com/try-free/
echo 2. Create a free account and database
echo 3. Get your new host, port, and credentials
echo 4. Update your .env file with the new details
echo.
echo After installing Redis with any of these options:
echo 1. Make sure your .env.local file contains:
echo    REDIS_HOST=localhost  (for options 1 and 2)
echo    REDIS_PORT=6379       (for options 1 and 2)
echo    REDIS_USERNAME=       (empty for local instances)
echo    REDIS_PASSWORD=       (empty for local instances)
echo.
echo 2. Or for Option 3, update with your new Redis Labs credentials
echo.
echo 3. Start your Node.js application with:
echo    npm run dev:local
echo.
echo For more help, visit: https://redis.io/docs/getting-started/
echo.
pause