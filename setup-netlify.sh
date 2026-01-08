#!/bin/bash

# Netlify + Supabase Setup Script
# This script helps you set up the project for deployment

echo "🎮 Werewolf Game - Netlify + Supabase Setup"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your Supabase credentials."
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if DATABASE_URL is set
if grep -q "YOUR-PASSWORD" .env 2>/dev/null; then
    echo "⚠️  WARNING: Please update your .env file with actual Supabase credentials"
    echo ""
    echo "You need to:"
    echo "1. Go to https://app.supabase.com/"
    echo "2. Create a new project or select existing one"
    echo "3. Go to Settings → Database"
    echo "4. Copy the connection string (URI format)"
    echo "5. Update DATABASE_URL in .env file"
    echo "6. Get your Supabase URL and Anon Key from Settings → API"
    echo "7. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
    echo ""
    echo "After updating .env, run: npm run db:setup"
    echo ""
else
    echo "🗄️  Setting up database..."
    npm run db:setup
    
    if [ $? -eq 0 ]; then
        echo "✅ Database setup complete"
        echo ""
    else
        echo "❌ Database setup failed. Please check your DATABASE_URL in .env"
        echo ""
    fi
fi

echo "📚 Next Steps:"
echo ""
echo "1. If you haven't already, update .env with your Supabase credentials"
echo "2. Run database setup: npm run db:setup"
echo "3. Run Supabase-specific setup in Supabase SQL Editor:"
echo "   - Copy contents of supabase-setup.sql"
echo "   - Paste in Supabase SQL Editor and run"
echo "4. Test locally: npm run dev"
echo "5. Deploy to Netlify:"
echo "   - Push code to GitHub"
echo "   - Connect repository in Netlify dashboard"
echo "   - Add environment variables in Netlify"
echo "   - Deploy!"
echo ""
echo "📖 For detailed instructions, see NETLIFY_SUPABASE_DEPLOYMENT.md"
echo ""
