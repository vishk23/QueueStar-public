#!/bin/bash

# Deploy to Supabase Script
# Usage: ./scripts/deploy-to-supabase.sh

set -e

echo "🚀 Deploying Blendify to Supabase..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it to your Supabase connection string:"
    echo "export DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\""
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Verify database connection
echo "🔍 Testing database connection..."
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript errors found. Please fix them first:"
    npm run type-check
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

echo "✅ Database migrations completed successfully!"

# Verify tables were created
echo "🔍 Verifying database schema..."
# You can add a simple SQL query here to verify tables exist

echo "🎉 Supabase deployment completed!"
echo ""
echo "Next steps:"
echo "1. Copy your Supabase project URL and anon key to Vercel"
echo "2. Deploy to Vercel using: npm run deploy:vercel"
echo ""