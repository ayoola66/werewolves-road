#!/bin/bash

# Replace these with your values
RENDER_API_KEY="YOUR_API_KEY"
SERVICE_ID="srv-YOUR_SERVICE_ID" # You can find this in your Render dashboard URL

# Fetch service status
curl -H "Authorization: Bearer $RENDER_API_KEY" \
     "https://api.render.com/v1/services/$SERVICE_ID" \
     | jq '.' 