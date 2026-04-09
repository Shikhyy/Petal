#!/bin/bash
# Deploy PETAL to Cloud Run (using Cloud Build)
# Usage: ./scripts/deploy-cloud-run.sh

set -e

PROJECT_ID="petal-492415"
REGION="us-central1"
SERVICE_NAME="petal"
IMAGE_NAME="petal-repo/petal"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

GCLOUD="/Users/shikhar/google-cloud-sdk/bin/gcloud"

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

ALLOWED_ORIGINS_VALUE="*"
GEMINI_MODEL_VALUE="${GEMINI_MODEL:-gemini-2.0-flash}"
DATABASE_URL_VALUE="$DATABASE_URL"

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
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="\
DATABASE_URL=${DATABASE_URL_VALUE},\
GEMINI_API_KEY=${GEMINI_API_KEY},\
GEMINI_MODEL=${GEMINI_MODEL_VALUE},\
SUPABASE_URL=${SUPABASE_URL},\
SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET},\
JWT_SECRET=${JWT_SECRET},\
ALLOWED_ORIGINS=${ALLOWED_ORIGINS_VALUE}" \
  --memory=2Gi \
  --cpu=2

# Get service URL
SERVICE_URL=$($GCLOUD run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' 2>/dev/null)
echo ""
echo "=== Deployed Successfully! ==="
echo "URL: $SERVICE_URL"