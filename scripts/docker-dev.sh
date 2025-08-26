#!/bin/bash

# Queue Star Docker Development Setup
echo "🎵 Starting Queue Star development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please add your API keys!"
    echo "   Required: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, OPENAI_API_KEY"
    echo ""
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres pgadmin

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec queuestar-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready!"
echo ""
echo "🚀 You can now start development:"
echo "   npm run dev"
echo ""
echo "🔧 Database Management:"
echo "   pgAdmin: http://localhost:5050"
echo "   Login: admin@queuestar.local / admin"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"