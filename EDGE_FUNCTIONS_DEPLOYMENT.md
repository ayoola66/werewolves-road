# Deploying Supabase Edge Functions

## Prerequisites

1. Install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   # or
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

## Deploy All Functions

From the project root, run:

```bash
supabase functions deploy create-game --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy join-game --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy start-game --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy submit-night-action --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy submit-vote --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy send-chat --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy process-night --project-ref lfexxmccwzfvlmwgqgdq
supabase functions deploy process-votes --project-ref lfexxmccwzfvlmwgqgdq
```

Or deploy all at once:
```bash
supabase functions deploy --project-ref lfexxmccwzfvlmwgqgdq
```

## Function URLs

After deployment, your functions will be available at:

- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/create-game`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/join-game`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/start-game`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/submit-night-action`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/submit-vote`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/send-chat`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/process-night`
- `https://lfexxmccwzfvlmwgqgdq.supabase.co/functions/v1/process-votes`

## Testing Functions Locally

```bash
supabase start
supabase functions serve
```

Then test with curl:
```bash
curl -X POST http://localhost:54321/functions/v1/create-game \
  -H "Content-Type: application/json" \
  -d '{"hostName":"Alice","settings":{"hasSeer":true,"hasDoctor":true,"dayDuration":300,"nightDuration":180}}'
```

## Environment Variables

The functions automatically have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (full access)

No additional configuration needed!

## Next Steps

After deploying, update the client code to call these Edge Functions instead of WebSocket messages.
