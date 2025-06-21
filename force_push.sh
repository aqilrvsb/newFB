#!/bin/bash
# Force push to GitHub without pull requests

echo "🚀 Starting force push to GitHub..."

# First, make sure we're in the right directory
cd "C:\Users\ROGSTRIX\Documents\newFB-main"

# Add all changes
echo "📦 Adding all changes..."
git add -A

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "🔧 Remove smart token implementation - Direct token usage

- Removed all smart token functions and helpers
- Updated replyToComment to use page token
- Updated deleteComment to use page token  
- Updated getPostMetrics to use page token (affects all insights)
- Updated sendDmToUser to use page token with pageId param
- Removed 5 smart token tools from HTTP server
- All 68 tools now use appropriate tokens directly"

# Add remote if not exists
echo "🔗 Setting up remote..."
git remote add origin https://github.com/aqilrvsb/newFB.git 2>/dev/null || echo "Remote already exists"

# Force push to main branch
echo "📤 Force pushing to main branch..."
git push origin main --force

# Also push to master branch
echo "📤 Force pushing to master branch..."
git push origin main:master --force

echo "✅ Force push completed! No pull requests needed."
echo "🚀 Railway should auto-deploy from master branch"
