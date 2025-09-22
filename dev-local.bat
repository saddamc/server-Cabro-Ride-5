@echo off
echo Starting development server with local .env.local configuration...
copy .env.local .env
npx ts-node-dev --respawn --transpile-only src/server.ts