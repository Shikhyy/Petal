#!/bin/bash
# Rebuild frontend with production API URL and deploy to GCS

set -euo pipefail

FRONTEND_URL="https://storage.googleapis.com/petal-frontend-uyaufdg"
BACKEND_URL="${BACKEND_URL:-https://petal-api-ycmhorzhoa-uc.a.run.app}"
VITE_API_URL_VALUE="${VITE_API_URL:-$BACKEND_URL/api/v1}"
VITE_WS_URL_VALUE="${VITE_WS_URL:-wss://petal-api-ycmhorzhoa-uc.a.run.app/api/v1}"
VITE_SUPABASE_URL_VALUE="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_ANON_KEY_VALUE="${VITE_SUPABASE_ANON_KEY:-}"

if [[ -z "$VITE_SUPABASE_URL_VALUE" || -z "$VITE_SUPABASE_ANON_KEY_VALUE" ]]; then
	echo "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set before running this script."
	exit 1
fi

cd /Users/shikhar/Petal/frontend

# Build with production env
VITE_API_URL="$VITE_API_URL_VALUE" \
VITE_WS_URL="$VITE_WS_URL_VALUE" \
VITE_SUPABASE_URL="$VITE_SUPABASE_URL_VALUE" \
VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY_VALUE" \
npm run build

echo "=== Deploying to GCS ==="
export PATH="/Users/shikhar/google-cloud-sdk/bin:$PATH"
gsutil -m rsync -R dist/ gs://petal-frontend-uyaufdg/

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BACKEND_URL/api/v1"