# Railway Deployment Guide

This guide will help you deploy the Werewolf game to Railway.

## Prerequisites

1. Install Railway CLI:

   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

## Deployment Steps

### 1. Initialize Railway Project

```bash
# Initialize a new Railway project
railway init

# Link to existing project (if you have one)
railway link
```

### 2. Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add

# Select PostgreSQL from the list
```

### 3. Configure Environment Variables

Set the following environment variables in Railway dashboard:

- `DATABASE_URL`: Automatically set by Railway when you add PostgreSQL
- `NODE_ENV`: `production`
- `PORT`: `8080` (Railway will set this automatically)
- `HOST`: `0.0.0.0`

### 4. Deploy the Application

```bash
# Deploy to Railway
railway up

# Or use the deployment script
./scripts/railway-deploy.sh
```

### 5. Set Custom Domain (Optional)

```bash
# Add custom domain
railway domain

# Follow the prompts to configure your domain
```

## Database Setup

The application will automatically run migrations on startup. The database tables will be created automatically when the application starts.

## Monitoring

- View logs: `railway logs`
- Check status: `railway status`
- Open dashboard: `railway open`

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that the `DATABASE_URL` environment variable is set correctly
2. Verify the PostgreSQL service is running
3. Check the application logs for migration errors

### Build Issues

If the build fails:

1. Ensure all dependencies are in `package.json`
2. Check that the build script works locally: `npm run build`
3. Verify the start script: `npm run start`

## Environment Variables Reference

| Variable       | Description                          | Required              |
| -------------- | ------------------------------------ | --------------------- |
| `DATABASE_URL` | PostgreSQL connection string         | Yes                   |
| `NODE_ENV`     | Environment (production/development) | Yes                   |
| `PORT`         | Port to run the application on       | No (auto-set)         |
| `HOST`         | Host to bind to                      | No (default: 0.0.0.0) |
| `SENTRY_DSN`   | Sentry error tracking                | No                    |

## Features

- ✅ Automatic database migrations
- ✅ WebSocket support for real-time game
- ✅ PostgreSQL database
- ✅ Health check endpoint
- ✅ Automatic SSL/HTTPS
- ✅ Custom domain support
- ✅ Environment variable management
