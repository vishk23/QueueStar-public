#!/bin/bash

echo "🧹 Tearing down Blendify test environment..."

echo "🛑 Stopping Supabase..."
supabase stop

echo "📦 Stopping Docker services..."
docker-compose -f docker-compose.test.yml down -v

echo "🗑️ Cleaning up test files..."
rm -f .env.test.local

echo "✅ Test environment cleaned up!"