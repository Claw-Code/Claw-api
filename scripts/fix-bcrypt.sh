#!/bin/bash

# Script to fix bcrypt native module issues

echo "🔧 Fixing bcrypt native module issues for Claw API..."

# Check if we're in a Docker container
if [ -f /.dockerenv ]; then
    echo "📦 Running inside Docker container"
    IN_DOCKER=true
else
    echo "💻 Running on host machine"
    IN_DOCKER=false
fi

# Check Node.js version
node_version=$(node --version)
echo "📋 Node.js version: $node_version"

# Check current bcrypt installation
if [ -d node_modules/bcrypt ]; then
    echo "📦 bcrypt is installed"
    
    # Try to require bcrypt to see if it works
    if node -e "require('bcrypt')" 2>/dev/null; then
        echo "✅ bcrypt is working correctly"
        exit 0
    else
        echo "❌ bcrypt is not working - needs rebuild"
    fi
else
    echo "❌ bcrypt is not installed"
fi

# Install build tools if needed (Linux)
if command -v apt-get &> /dev/null; then
    echo "🔧 Installing build tools..."
    apt-get update && apt-get install -y python3 make g++ build-essential
elif command -v yum &> /dev/null; then
    echo "🔧 Installing build tools..."
    yum groupinstall -y "Development Tools"
    yum install -y python3
fi

# Remove existing bcrypt
echo "🗑️  Removing existing bcrypt..."
npm uninstall bcrypt 2>/dev/null || true
rm -rf node_modules/bcrypt 2>/dev/null || true

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Reinstall bcrypt with build from source
echo "📦 Installing bcrypt from source..."
npm install bcrypt@^5.1.1 --build-from-source --legacy-peer-deps

# Verify installation
echo "✅ Verifying bcrypt installation..."
if node -e "const bcrypt = require('bcrypt'); console.log('bcrypt version:', require('bcrypt/package.json').version)" 2>/dev/null; then
    echo "✅ bcrypt is now working correctly!"
else
    echo "❌ bcrypt installation failed"
    
    # Try alternative: bcryptjs (pure JavaScript implementation)
    echo "🔄 Trying bcryptjs as alternative..."
    npm uninstall bcrypt 2>/dev/null || true
    npm install bcryptjs@^2.4.3 --legacy-peer-deps
    
    echo "⚠️  Switched to bcryptjs (pure JavaScript implementation)"
    echo "📝 You may need to update your imports from 'bcrypt' to 'bcryptjs'"
    
    # Create a compatibility shim
    cat > bcrypt-shim.js << 'EOF'
// Compatibility shim for bcryptjs
module.exports = require('bcryptjs');
EOF
    
    echo "📄 Created bcrypt-shim.js for compatibility"
fi

echo "✅ bcrypt fix complete!"
