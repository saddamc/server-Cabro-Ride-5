# Redis Configuration Guide

## Redis Connection Error

If you're seeing this error:
```
Redis Client Error Error: getaddrinfo ENOTFOUND redis-19032.c323.us-east-1-2.ec2.redns.redis-cloud.com
```

It means the application cannot connect to the Redis server. This might happen because:
1. The Redis Cloud service is no longer available or credentials have changed
2. Your network is blocking the connection
3. DNS resolution is failing

## Solution Options

### Option 1: Use Local Redis (Recommended for Development)

1. Install Redis locally (using WSL, Docker, or native install)
2. Update your Redis configuration to use localhost

#### Using Docker (Easiest on Windows)
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop/
# Then run:
docker run --name redis-local -p 6379:6379 -d redis
```

#### Using the provided setup guide
```bash
# Run our setup guide
npm run redis:guide
```

### Option 2: Create a new Redis Cloud account

1. Go to https://redis.com/try-free/
2. Create a free account and database
3. Get your new host, port, and credentials 
4. Update your .env file with the new details

## Running with Local Redis Configuration

We've created a special configuration and scripts to make it easy to use local Redis:

```bash
# On Windows:
npm run dev:local

# On Linux/Mac:
npm run dev:local:linux
```

This will use the .env.local file which is configured for local Redis.

## Fallback Mechanism

The application has been updated with a memory-based fallback when Redis is unavailable. This means:

1. OTP features will still work even without Redis
2. However, this is not recommended for production use as it doesn't scale across multiple instances

For production, always ensure Redis is properly configured.