#!/bin/bash

# Restore development configuration after deployment

echo "🔄 Restoring development configuration..."

if [ -f "tsconfig.json.backup" ]; then
    mv tsconfig.json.backup tsconfig.json
    echo "✅ Restored original tsconfig.json"
else
    echo "⚠️  No backup found. Please check your tsconfig.json manually."
fi

echo "✅ Development environment restored"