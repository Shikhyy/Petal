# PETAL — GCP Infrastructure (Terraform)
# Usage: terraform init && terraform plan && terraform apply

terraform {
  required_version = ">= 1.8.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.25"
    }
  }
  backend "gcs" {
    bucket = "petal-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Variables ────────────────────────────────────────────────────────────
variable "project_id" { type = string }
variable "region"     { type = string; default = "us-central1" }
variable "env"        { type = string; default = "prod" }

# ── Artifact Registry ────────────────────────────────────────────────────
resource "google_artifact_registry_repository" "petal" {
  location      = var.region
  repository_id = "petal-repo"
  description   = "PETAL Docker images"
  format        = "DOCKER"
}

# ── Firestore ────────────────────────────────────────────────────────────
resource "google_firestore_database" "petal" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}

# ── Secret Manager ───────────────────────────────────────────────────────
resource "google_secret_manager_secret" "secret_key" {
  secret_id = "petal-secret-key"
  replication { auto {} }
}

# ── Service Account ──────────────────────────────────────────────────────
resource "google_service_account" "petal_sa" {
  account_id   = "petal-sa"
  display_name = "PETAL Service Account"
}

resource "google_project_iam_member" "petal_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.petal_sa.email}"
}

resource "google_project_iam_member" "petal_secret" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.petal_sa.email}"
}

resource "google_project_iam_member" "petal_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.petal_sa.email}"
}

resource "google_project_iam_member" "petal_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.petal_sa.email}"
}

# ── Cloud Run ─────────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "petal_api" {
  name     = "petal-api"
  location = var.region

  template {
    service_account = google_service_account.petal_sa.email
    
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/petal-repo/petal-api:latest"
      
      ports { container_port = 8080 }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = true
      }

      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "GEMINI_MODEL"
        value = "gemini-2.0-flash"
      }
      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }

      liveness_probe {
        http_get { path = "/health" }
        initial_delay_seconds = 15
        period_seconds        = 30
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_artifact_registry_repository.petal]
}

# Allow unauthenticated access (public API with JWT auth in app layer)
resource "google_cloud_run_service_iam_member" "public" {
  location = var.region
  service  = google_cloud_run_v2_service.petal_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Outputs ───────────────────────────────────────────────────────────────
output "api_url" {
  value       = google_cloud_run_v2_service.petal_api.uri
  description = "PETAL API Cloud Run URL"
}

output "service_account_email" {
  value = google_service_account.petal_sa.email
}
