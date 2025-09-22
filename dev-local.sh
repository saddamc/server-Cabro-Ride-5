#!/bin/bash
echo "Starting development server with local .env.local configuration..."
cp .env.local .env
npx ts-node-dev --respawn --transpile-only src/server.ts