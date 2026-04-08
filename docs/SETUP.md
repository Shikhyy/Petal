# PETAL — Setup & Deployment Guide
**Stack:** Google ADK · Gemini 2.0 Flash · GCP Cloud Run · Firestore

---

## Prerequisites

- Python 3.12+
- Node.js 20+
- Google Cloud SDK (`gcloud`)
- Docker Desktop
- A GCP project with billing enabled
- Firebase project (can reuse GCP project)

---

## 1. GCP Project Setup

```bash
# Set your project
export PROJECT_ID="petal-workspace"
export REGION="us-central1"

gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  gmail.googleapis.com \
  calendar-json.googleapis.com \
  logging.googleapis.com \
  cloudtrace.googleapis.com

# Create Firestore database
gcloud firestore databases create --location=$REGION --type=firestore-native

# Create Artifact Registry repository
gcloud artifacts repositories create petal-repo \
  --repository-format=docker \
  --location=$REGION
```

---

## 2. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init

# Select: Hosting, Firestore
# Project: use existing GCP project
# Public dir: frontend/dist
# SPA: Yes
```

---

## 3. Google ADK Setup

```bash
pip install google-adk

# Authenticate for local development
gcloud auth application-default login
gcloud auth application-default set-quota-project $PROJECT_ID
```

---

## 4. Secrets Configuration

```bash
# Create secrets in Secret Manager
echo -n "your-jwt-secret-here" | gcloud secrets create petal-jwt-secret --data-file=-
echo -n "your-gemini-api-key-here" | gcloud secrets create petal-gemini-api-key --data-file=-
echo -n "your-firebase-service-account-json" | gcloud secrets create firebase-admin-key --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding petal-jwt-secret \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding petal-gemini-api-key \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Local Development

```bash
# Clone repo
git clone https://github.com/yourorg/petal.git
cd petal

# Backend setup
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill environment
cp .env.example .env
# Edit .env with your values

# Start backend
uvicorn backend.main:app --reload --port 8080

# In another terminal: frontend
cd frontend
npm install
cp .env.example .env.local  # fill VITE_ vars
npm run dev
# → http://localhost:5173
```

### Docker Compose (Recommended)

```bash
docker-compose up --build
# Backend: http://localhost:8080
# Frontend: http://localhost:5173
```

---

## 6. GCP Cloud Run Deployment

```bash
# Build and submit to Cloud Build
gcloud builds submit \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/petal-repo/petal-api:latest \
  --project $PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy petal-api \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/petal-repo/petal-api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars "GCP_PROJECT=$PROJECT_ID,GCP_REGION=$REGION,GEMINI_MODEL=gemini-2.0-flash,ALLOWED_ORIGINS=*" \
  --set-secrets "JWT_SECRET=petal-jwt-secret:latest,GEMINI_API_KEY=petal-gemini-api-key:latest"

# Get service URL
gcloud run services describe petal-api --region $REGION --format 'value(status.url)'
```

---

## 7. Frontend Deployment (Cloud Run)

```bash
gcloud builds submit \
  --config cloudbuild-frontend.yaml \
  --substitutions=_API_URL=https://petal-api-xxxx-uc.a.run.app/api/v1,_WS_URL=wss://petal-api-xxxx-uc.a.run.app/api/v1 \
  .
```

---

## 8. CI/CD with Cloud Build

```bash
# Connect GitHub repo to Cloud Build
gcloud beta builds triggers create github \
  --repo-name=petal \
  --repo-owner=yourorg \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --project $PROJECT_ID
```

---

## 9. Firestore Indexes

Create these composite indexes in the Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "user_id", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "user_id", "order": "ASCENDING"},
        {"fieldPath": "priority", "order": "ASCENDING"},
        {"fieldPath": "due_date", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "user_id", "order": "ASCENDING"},
        {"fieldPath": "updated_at", "order": "DESCENDING"}
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 10. Health Check

```bash
# Test deployed API
curl https://YOUR_CLOUD_RUN_URL/health
# Expected: {"status":"ok","service":"petal-api","version":"1.0.0"}

# Test chat endpoint (requires auth token)
curl -X POST https://YOUR_CLOUD_RUN_URL/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"message": "What tasks do I have?", "session_id": "test-001"}'
```

---

## 11. Teardown

```bash
# Delete Cloud Run service
gcloud run services delete petal-api --region $REGION

# Delete Firestore data (careful!)
# Use Firebase Console → Firestore → delete collections

# Delete secrets
gcloud secrets delete petal-secret-key
gcloud secrets delete firebase-admin-key
```
