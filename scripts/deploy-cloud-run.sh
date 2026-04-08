#!/bin/bash
# Deploy PETAL to Cloud Run (using Cloud Build)
# Usage: ./scripts/deploy-cloud-run.sh

set -e

PROJECT_ID="petal-492415"
REGION="us-central1"
SERVICE_NAME="petal"
IMAGE_NAME="petal-repo/petal"

GCLOUD="/Users/shikhar/google-cloud-sdk/bin/gcloud"

echo "=== PETAL Cloud Run Deployment ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

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
DATABASE_URL=${DATABASE_URL},\
GEMINI_API_KEY=${GEMINI_API_KEY},\
GEMINI_MODEL=gemini-2.0-flash,\
SUPABASE_URL=${SUPABASE_URL},\
SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET},\
JWT_SECRET=${JWT_SECRET},\
ALLOWED_ORIGINS=*" \
  --memory=2Gi \
  --cpu=2

# Get service URL
SERVICE_URL=$($GCLOUD run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' 2>/dev/null)
echo ""
echo "=== Deployed Successfully! ==="
echo "URL: $SERVICE_URL"