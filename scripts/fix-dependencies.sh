#!/bin/bash

# Script to fix npm dependency conflicts

echo "🔧 Fixing npm dependency conflicts for Claw API..."

# Check Node.js version
node_version=$(node --version)
npm_version=$(npm --version)
echo "📋 Current versions:"
echo "  Node.js: $node_version"
echo "  npm: $npm_version"

# Backup existing package-lock.json if it exists
if [ -f package-lock.json ]; then
    echo "💾 Backing up existing package-lock.json..."
    cp package-lock.json package-lock.json.backup
fi

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and package-lock.json
echo "🗑️  Removing node_modules and package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# Update npm to latest version
echo "⬆️  Updating npm to latest version..."
npm install -g npm@latest

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps

# Verify installation
echo "✅ Verifying installation..."
if [ -d node_modules ] && [ -f package-lock.json ]; then
    echo "✅ Dependencies installed successfully!"
    
    # Show installed packages
    echo "📋 Key packages installed:"
    npm list --depth=0 | grep -E "(fastify|mongodb|typescript|tsx)" || true
    
else
    echo "❌ Installation failed!"
    exit 1
fi

# Create .npmrc file to persist settings
echo "📝 Creating .npmrc file..."
cat > .npmrc << EOF
legacy-peer-deps=true
fund=false
audit=false
EOF

echo "✅ Dependency fix complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Try running: npm run dev"
echo "2. If issues persist, run: npm run install:clean"
echo "3. For Docker builds, dependencies are handled automatically"
