#!/bin/bash

# Railway deployment script
echo "🚂 Deploying to Railway..."

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://$(railway domain)" 