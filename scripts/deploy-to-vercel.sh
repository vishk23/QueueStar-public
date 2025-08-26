#!/bin/bash

# Deploy to Vercel Script
# Usage: ./scripts/deploy-to-vercel.sh

set -e

echo "🚀 Preparing Blendify for Vercel deployment..."

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Type check
if npm run type-check; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript errors found. Please fix them first."
    exit 1
fi

# Lint check
if npm run lint; then
    echo "✅ Lint check passed"
else
    echo "⚠️  Lint warnings found, but continuing..."
fi

# Build check
echo "🔧 Testing build..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi

echo ""
echo "🎉 Pre-deployment checks completed!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Vercel"
echo "3. Set the following environment variables in Vercel:"
echo ""
echo "Required Environment Variables:"
echo "================================"
cat .env.example | grep -v "^#" | grep -v "^$" | sort
echo ""
echo "📖 See deploy-guide.md for detailed instructions"
echo ""