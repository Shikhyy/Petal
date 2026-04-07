#!/bin/bash
# Database setup script for PETAL
# Usage: ./scripts/setup-db.sh

set -e

echo "Setting up PETAL database..."

# Check for required env vars
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    echo "Please set DATABASE_URL or run from project root with .env loaded"
    exit 1
fi

# Run the migration
echo "Running initial schema migration..."
psql "$DATABASE_URL" -f infrastructure/supabase/migrations/001_initial_schema.sql

echo "Database setup complete!"
echo ""
echo "Tables created:"
echo "  - profiles"
echo "  - tasks"
echo "  - notes"
echo "  - sessions"
echo "  - calendar_events"
echo ""
echo "To verify: psql \$DATABASE_URL -c '\dt'"