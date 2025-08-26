#!/bin/bash

echo "🚀 Setting up Blendify test environment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "📦 Starting test services with Docker..."
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️ Starting Supabase local development..."
supabase start

echo "📝 Generating database migrations..."
npm run db:generate

echo "🔄 Running database migrations..."
supabase db reset

echo "🧪 Setting up test environment variables..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
export NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | cut -d'|' -f3 | xargs)
export SUPABASE_SERVICE_ROLE_KEY=$(supabase status | grep "service_role key" | cut -d'|' -f3 | xargs)

# Create test environment file
cat > .env.test.local << EOF
# Test Environment Variables
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# OAuth Test Credentials (Mock)
SPOTIFY_CLIENT_ID=test_spotify_client_id
SPOTIFY_CLIENT_SECRET=test_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback

APPLE_TEAM_ID=test_apple_team_id
APPLE_KEY_ID=test_apple_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg4f4yI2iJE8kVYY4W\n-----END PRIVATE KEY-----"
APPLE_REDIRECT_URI=http://localhost:3000/api/auth/apple/callback

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Rate Limiting
UPSTASH_REDIS_URL=redis://localhost:6380
UPSTASH_REDIS_TOKEN=test_token
EOF

echo "✅ Test environment ready!"
echo ""
echo "🔗 Available services:"
echo "   • Database: http://localhost:54322"
echo "   • Supabase Studio: http://localhost:54323"
echo "   • API: http://localhost:54321"
echo "   • Inbucket (emails): http://localhost:54324"
echo ""
echo "🧪 Run tests with: npm run test:integration"
echo "🎯 Run specific test: npm run test tests/integration/auth/spotify.test.ts"