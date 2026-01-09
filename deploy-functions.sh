#!/bin/bash

# Deploy new Edge Functions to Supabase
# Run this script after logging in: supabase login

set -e

echo "🚀 Deploying Edge Functions to Supabase..."
echo ""

# Check if logged in
if ! supabase projects list &>/dev/null; then
    echo "❌ Not logged in to Supabase CLI"
    echo "Please run: supabase login"
    echo "This will open your browser to authenticate."
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Deploy leave-game function
echo "📦 Deploying leave-game function..."
supabase functions deploy leave-game --project-ref lfexxmccwzfvlmwgqgdq

echo ""

# Deploy start-voting function
echo "📦 Deploying start-voting function..."
supabase functions deploy start-voting --project-ref lfexxmccwzfvlmwgqgdq

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Functions are now available at:"
echo "  - https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/leave-game"
echo "  - https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/start-voting"
