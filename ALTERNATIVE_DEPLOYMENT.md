# 🚀 Alternative Deployment: Using Supabase Dashboard

If you're having trouble with the Supabase CLI, you can deploy Edge Functions directly through the Supabase Dashboard.

## Method 1: Deploy via Dashboard (Easiest)

### Step 1: Go to Supabase Dashboard
1. Visit https://supabase.com/dashboard/project/lfexxmccwzfvlmwgqgdq
2. Click on "Edge Functions" in the left sidebar

### Step 2: Create Each Function
For each function, click "Create a new function" and:

#### Function 1: create-game
- **Name**: `create-game`
- **Code**: Copy from `supabase/functions/create-game/index.ts`
- Click "Deploy function"

#### Function 2: join-game
- **Name**: `join-game`
- **Code**: Copy from `supabase/functions/join-game/index.ts`
- Click "Deploy function"

#### Function 3: start-game
- **Name**: `start-game`
- **Code**: Copy from `supabase/functions/start-game/index.ts`
- Click "Deploy function"

#### Function 4: submit-night-action
- **Name**: `submit-night-action`
- **Code**: Copy from `supabase/functions/submit-night-action/index.ts`
- Click "Deploy function"

#### Function 5: submit-vote
- **Name**: `submit-vote`
- **Code**: Copy from `supabase/functions/submit-vote/index.ts`
- Click "Deploy function"

#### Function 6: send-chat
- **Name**: `send-chat`
- **Code**: Copy from `supabase/functions/send-chat/index.ts`
- Click "Deploy function"

#### Function 7: process-night
- **Name**: `process-night`
- **Code**: Copy from `supabase/functions/process-night/index.ts`
- Click "Deploy function"

#### Function 8: process-votes
- **Name**: `process-votes`
- **Code**: Copy from `supabase/functions/process-votes/index.ts`
- Click "Deploy function"

### Step 3: Copy Shared Utilities
For each function that imports from `../_shared/`, you'll need to inline the shared code or create the shared files first.

**Easier approach**: Inline the utilities directly in each function file.

## Method 2: Deploy via GitHub Actions (Automated)

Create `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Supabase Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

Then add secrets to your GitHub repo:
- `SUPABASE_PROJECT_REF`: `lfexxmccwzfvlmwgqgdq`
- `SUPABASE_ACCESS_TOKEN`: Get from https://supabase.com/dashboard/account/tokens

## Method 3: Manual CLI Installation (macOS)

If Homebrew didn't work, try:

```bash
# Download binary directly
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz -o supabase.tar.gz
tar -xzf supabase.tar.gz
sudo mv supabase /usr/local/bin/
supabase --version
```

Then deploy:
```bash
supabase login
supabase functions deploy --project-ref lfexxmccwzfvlmwgqgdq
```

## Method 4: Use Docker

```bash
docker run --rm -v $(pwd):/workspace -w /workspace supabase/cli:latest functions deploy --project-ref lfexxmccwzfvlmwgqgdq
```

## Quick Test Without Deployment

You can test the functions locally without deploying:

```bash
# Start local Supabase
npx supabase start

# Serve functions locally
npx supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/create-game \
  -H "Content-Type: application/json" \
  -d '{"hostName":"Alice","settings":{"hasSeer":true,"hasDoctor":true,"dayDuration":300,"nightDuration":180}}'
```

## Recommended: Dashboard Deployment

For now, I recommend using **Method 1 (Dashboard)** as it's the most straightforward and doesn't require any CLI installation.

Once you deploy via the dashboard, your functions will be immediately available at:
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/create-game`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/join-game`
- etc.

The client is already configured to call these URLs! 🎉
