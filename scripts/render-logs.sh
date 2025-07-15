#!/bin/bash

# Replace these with your values
RENDER_API_KEY="rnd_UeyV4nzmE1tvS7h5jKSymU0cdCOn"
SERVICE_ID="srv-d1qfuojuibrs73emcd00" # You can find this in your Render dashboard URL

# Fetch the latest logs
curl -H "Authorization: Bearer $RENDER_API_KEY" \
     "https://api.render.com/v1/services/$SERVICE_ID/events?limit=100"

# To stream logs in real-time
# curl -H "Authorization: Bearer $RENDER_API_KEY" \
#      "https://api.render.com/v1/services/$SERVICE_ID/logs?stream=true" 