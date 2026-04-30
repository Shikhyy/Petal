#!/bin/bash
# Deploy PETAL to Cloud Run (using Cloud Build)
# Usage: ./scripts/deploy-cloud-run.sh

set -e

PROJECT_ID="petal-492415"
REGION="us-central1"
SERVICE_NAME="petal-api"
IMAGE_NAME="petal-repo/petal-api"

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

echo "=== PETAL Cloud Run Deployment ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Load environment variables from repository .env
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

required_vars=(
  DATABASE_URL
  GEMINI_API_KEY
  GROQ_API_KEY
  SUPABASE_URL
  SUPABASE_JWT_SECRET
  JWT_SECRET
)

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name}" ]; then
    echo "Error: Required env var '$var_name' is missing in .env"
    exit 1
  fi
done

ensure_secret() {
	local secret_name="$1"
	local secret_value="$2"

	if ! "$GCLOUD" secrets describe "$secret_name" >/dev/null 2>&1; then
		"$GCLOUD" secrets create "$secret_name" --replication-policy="automatic" >/dev/null
	fi

	printf '%s' "$secret_value" | "$GCLOUD" secrets versions add "$secret_name" --data-file=- >/dev/null
}

ensure_secret "petal-database-url" "$DATABASE_URL"
ensure_secret "petal-gemini-api-key" "$GEMINI_API_KEY"
ensure_secret "petal-groq-api-key" "$GROQ_API_KEY"
ensure_secret "petal-jwt-secret" "$JWT_SECRET"

PROJECT_NUMBER="$($GCLOUD projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"

grant_secret_access() {
  local secret_name="$1"
  "$GCLOUD" secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" >/dev/null
}

echo "Ensuring Secret Manager access for runtime service account: $RUNTIME_SERVICE_ACCOUNT"
grant_secret_access "petal-database-url"
grant_secret_access "petal-gemini-api-key"
grant_secret_access "petal-groq-api-key"
grant_secret_access "petal-jwt-secret"

ALLOWED_ORIGINS_VALUE="*"
GEMINI_MODEL_VALUE="${GEMINI_MODEL:-gemini-2.0-flash}"
GROQ_MODEL_VALUE="${GROQ_MODEL:-llama-3.1-8b-instant}"
DATABASE_URL_VALUE="$DATABASE_URL"
GCAL_MCP_URL_VALUE="${GCAL_MCP_URL:-}"
GMAIL_MCP_URL_VALUE="${GMAIL_MCP_URL:-}"

if [[ "$GCAL_MCP_URL_VALUE" == http://localhost* || "$GCAL_MCP_URL_VALUE" == https://localhost* || "$GCAL_MCP_URL_VALUE" == http://127.0.0.1* || "$GCAL_MCP_URL_VALUE" == https://127.0.0.1* ]]; then
  echo "Warning: GCAL_MCP_URL points to localhost and is unreachable from Cloud Run. Disabling calendar MCP URL for this deploy."
  GCAL_MCP_URL_VALUE=""
fi

if [[ "$GMAIL_MCP_URL_VALUE" == http://localhost* || "$GMAIL_MCP_URL_VALUE" == https://localhost* || "$GMAIL_MCP_URL_VALUE" == http://127.0.0.1* || "$GMAIL_MCP_URL_VALUE" == https://127.0.0.1* ]]; then
  echo "Warning: GMAIL_MCP_URL points to localhost and is unreachable from Cloud Run. Disabling gmail MCP URL for this deploy."
  GMAIL_MCP_URL_VALUE=""
fi

# If DATABASE_URL points at the Supabase API host (<ref>.supabase.co),
# rewrite it to the Postgres host (db.<ref>.supabase.co).
if [[ "$DATABASE_URL_VALUE" =~ @([^.@/]+)\.supabase\.co(:[0-9]+)?/ ]]; then
  ref_host="${BASH_REMATCH[1]}"
  if [[ "$DATABASE_URL_VALUE" != *"@db.${ref_host}.supabase.co"* ]]; then
    DATABASE_URL_VALUE="${DATABASE_URL_VALUE/@${ref_host}.supabase.co/@db.${ref_host}.supabase.co}"
    echo "Adjusted DATABASE_URL host to db.${ref_host}.supabase.co"
  fi
fi

# Step 1: Enable required APIs
echo "Enabling required APIs..."
$GCLOUD services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project=$PROJECT_ID 2>/dev/null || true

# Step 2: Create Artifact Registry repository
echo "Creating Artifact Registry repository..."
$GCLOUD artifacts repositories create petal-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="PETAL container images" \
  2>/dev/null || echo "Repository already exists"

# Step 3: Configure Docker
echo "Configuring Docker..."
$GCLOUD auth configure-docker us-central1-docker.pkg.dev --quiet

# Step 4: Build and push using Cloud Build
echo "Building Docker image with Cloud Build..."
$GCLOUD builds submit \
  --project=$PROJECT_ID \
  --tag "us-central1-docker.pkg.dev/$PROJECT_ID/$IMAGE_NAME:latest" \
  --gcs-log-dir="gs://petal-build-logs/builds" \
  .

# Step 5: Deploy to Cloud Run
echo "Deploying to Cloud Run..."
$GCLOUD run deploy $SERVICE_NAME \
  --image "us-central1-docker.pkg.dev/$PROJECT_ID/$IMAGE_NAME:latest" \
  --region $REGION \
  --platform managed \
  --service-account "$RUNTIME_SERVICE_ACCOUNT" \
  --update-secrets="DATABASE_URL=petal-database-url:latest,GEMINI_API_KEY=petal-gemini-api-key:latest,GROQ_API_KEY=petal-groq-api-key:latest,JWT_SECRET=petal-jwt-secret:latest" \
  --set-env-vars="GEMINI_MODEL=${GEMINI_MODEL_VALUE},GROQ_MODEL=${GROQ_MODEL_VALUE},SUPABASE_URL=${SUPABASE_URL},SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET},ALLOWED_ORIGINS=${ALLOWED_ORIGINS_VALUE},GCAL_MCP_URL=${GCAL_MCP_URL_VALUE},GMAIL_MCP_URL=${GMAIL_MCP_URL_VALUE}" \
  --memory=2Gi \
  --cpu=2

# Get service URL
SERVICE_URL=$($GCLOUD run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' 2>/dev/null)
echo ""
echo "=== Deployed Successfully! ==="
echo "URL: $SERVICE_URL"