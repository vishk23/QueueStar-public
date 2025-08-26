#!/bin/bash

# Prepare for production deployment
# This script temporarily excludes test files for clean deployment

echo "🔧 Preparing for production deployment..."

# Backup original tsconfig.json
if [ ! -f "tsconfig.json.backup" ]; then
    cp tsconfig.json tsconfig.json.backup
    echo "✅ Backed up tsconfig.json"
fi

# Use production tsconfig
cp tsconfig.json.production tsconfig.json
echo "✅ Applied production TypeScript configuration"

# Test build
echo "🔍 Testing production build..."
if npm run build; then
    echo "✅ Production build successful!"
    echo ""
    echo "Your app is ready for deployment to Vercel"
    echo "Don't forget to restore the original config after deployment:"
    echo "  ./scripts/restore-dev.sh"
else
    echo "❌ Production build failed"
    # Restore original config
    mv tsconfig.json.backup tsconfig.json
    exit 1
fi