#!/bin/bash
# Deploy frontend to Cloud Run via Cloud Build using production API/Auth substitutions.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-petal-492415}"
REGION="${REGION:-us-central1}"
BACKEND_SERVICE="${BACKEND_SERVICE:-petal-api}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

GCLOUD="${GCLOUD:-$(command -v gcloud || true)}"

if [ -z "$GCLOUD" ] && [ -x "/opt/homebrew/share/google-cloud-sdk/bin/gcloud" ]; then
	GCLOUD="/opt/homebrew/share/google-cloud-sdk/bin/gcloud"
fi

if [ -z "$GCLOUD" ] && [ -x "$HOME/google-cloud-sdk/bin/gcloud" ]; then
	GCLOUD="$HOME/google-cloud-sdk/bin/gcloud"
fi

if [ -z "$GCLOUD" ]; then
	echo "Error: gcloud CLI not found. Install Google Cloud SDK and ensure 'gcloud' is on PATH."
	exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
	echo "Error: .env file not found at $ENV_FILE"
	exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
	echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env"
	exit 1
fi

SUPABASE_HOST="$(echo "$SUPABASE_URL" | sed -E 's#^https?://##' | cut -d/ -f1)"
if [ -z "$SUPABASE_HOST" ]; then
	echo "Error: Could not parse host from SUPABASE_URL=$SUPABASE_URL"
	exit 1
fi

if ! python3 - <<PY
import socket
socket.gethostbyname("$SUPABASE_HOST")
PY
then
	if nslookup "$SUPABASE_HOST" 8.8.8.8 >/dev/null 2>&1 || nslookup "$SUPABASE_HOST" 1.1.1.1 >/dev/null 2>&1; then
		echo "Warning: Local DNS could not resolve $SUPABASE_HOST, but public DNS resolves it. Continuing deployment."
	else
		echo "Error: Supabase host does not resolve: $SUPABASE_HOST"
		echo "Update SUPABASE_URL and VITE_SUPABASE_URL in .env with your active Supabase project URL."
		exit 1
	fi
fi

if [ -z "${BACKEND_URL:-}" ]; then
	BACKEND_URL="$($GCLOUD run services describe "$BACKEND_SERVICE" --region "$REGION" --platform managed --format 'value(status.url)')"
fi

if [ -z "$BACKEND_URL" ]; then
	echo "Error: Could not resolve backend URL. Set BACKEND_URL env var or deploy backend service first."
	exit 1
fi

API_URL="${VITE_API_URL:-}"
if [[ -z "$API_URL" || "$API_URL" == http://localhost* || "$API_URL" == https://localhost* ]]; then
	API_URL="$BACKEND_URL/api/v1"
fi

WS_URL="${VITE_WS_URL:-}"
if [[ -z "$WS_URL" || "$WS_URL" == ws://localhost* || "$WS_URL" == wss://localhost* ]]; then
	if [[ "$API_URL" == https://* ]]; then
		WS_URL="${API_URL/https:/wss:}"
	else
		WS_URL="${API_URL/http:/ws:}"
	fi
fi

echo "=== Frontend Cloud Run Deployment ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Backend URL: $BACKEND_URL"

"$GCLOUD" builds submit \
	--project "$PROJECT_ID" \
	--config "${ROOT_DIR}/cloudbuild-frontend.yaml" \
	--substitutions "_REGION=${REGION},_API_URL=${API_URL},_WS_URL=${WS_URL},_SUPABASE_URL=${SUPABASE_URL},_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" \
	"$ROOT_DIR"

FRONTEND_URL="$($GCLOUD run services describe petal-frontend --region "$REGION" --platform managed --format 'value(status.url)')"
BACKEND_SERVICE_URL="$($GCLOUD run services describe "$BACKEND_SERVICE" --region "$REGION" --platform managed --format 'value(status.url)')"

echo ""
echo "=== Deployment Complete ==="
echo "Frontend App URL: $FRONTEND_URL"
echo "Backend Service URL: $BACKEND_SERVICE_URL"
echo "Backend API Base: $API_URL"
echo ""
echo "Open the Frontend App URL in your browser."
echo "The Backend Service URL is API-only and will not render the app UI."