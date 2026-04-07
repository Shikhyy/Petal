terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "image" {
  description = "Docker image to deploy"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "database_url" {
  description = "Cloud SQL connection string"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Gemini API Key"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase URL"
  type        = string
}

variable "supabase_jwt_secret" {
  description = "Supabase JWT Secret"
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = string
  default     = "*"
}

# Cloud Run Service
resource "google_cloudrun_service" "petal" {
  name     = "petal"
  location = var.region

  template {
    spec {
      containers {
        image = var.image
        
        env {
          name  = "DATABASE_URL"
          value = var.database_url
        }
        env {
          name  = "GEMINI_API_KEY"
          value = var.gemini_api_key
        }
        env {
          name  = "SUPABASE_URL"
          value = var.supabase_url
        }
        env {
          name  = "SUPABASE_JWT_SECRET"
          value = var.supabase_jwt_secret
        }
        env {
          name  = "ALLOWED_ORIGINS"
          value = var.allowed_origins
        }
        env {
          name  = "GEMINI_MODEL"
          value = "gemini-2.0-flash"
        }
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        env {
          name  = "PORT"
          value = "8080"
        }
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
      }
      
      service_account_name = var.service_account_email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"    = "0"
        "autoscaling.knative.dev/maxScale"    = "10"
        "run.googleapis.com/cpu-throttling"   = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = ["allUsers"]
  }
}

resource "google_cloudrun_service_iam_policy" "noauth" {
  location    = google_cloudrun_service.petal.location
  project     = google_cloudrun_service.petal.project
  service     = google_cloudrun_service.petal.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

# Output
output "service_url" {
  value = google_cloudrun_service.petal.status[0].url
}