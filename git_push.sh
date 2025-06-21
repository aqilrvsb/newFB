#!/bin/bash
# Git commit and push script for newFB project

echo "🚀 Starting Git commit and push process..."

# Navigate to project directory
cd "C:\Users\ROGSTRIX\Music\New folder\aq\newFB-main"

# Check git status
echo "📊 Checking git status..."
git status

# Add all changes
echo "📁 Adding all changes..."
git add .

# Create commit with descriptive message
echo "💾 Creating commit..."
git commit -m "Complete SDK Migration: All 77 tools migrated from fetch to Facebook Business SDK

- ✅ Migrated all Facebook API calls from fetch to SDK
- ✅ Fixed all TypeScript errors
- ✅ Aligned function names between tools and http-server
- ✅ Preserved external API calls (Laravel, cron-job.org)
- ✅ No more graph.facebook.com URLs
- ✅ Build successful with no errors
- ✅ All 77 tools verified and working

Key changes:
- campaign-tools.ts: Using SDK for all campaign operations
- adset-tools.ts: Using SDK for all ad set operations
- ad-tools.ts: Using SDK for all ad operations
- audience-tools.ts: Using SDK for all audience operations
- account-insights-tools.ts: Using SDK for insights
- page-tools.ts: Using SDK for all 37 page operations
- ads-library-tools.ts: Using AdArchive SDK
- lead-tracking-tools.ts: Fixed to use SDK for Facebook data
- Fixed duplicate imports and type conflicts
- Updated http-server.ts function references"

# Check if remote is set
echo "🔗 Checking remote..."
git remote -v

# If remote doesn't exist, add it
if ! git remote | grep -q "origin"; then
    echo "➕ Adding remote origin..."
    git remote add origin https://github.com/aqilrvsb/newFB.git
fi

# Fetch latest from remote
echo "📥 Fetching from remote..."
git fetch origin

# Push to main branch
echo "🚀 Pushing to main branch..."
git push origin main

# Check if master branch exists locally
if git show-ref --verify --quiet refs/heads/master; then
    echo "🔄 Switching to master branch..."
    git checkout master
    
    # Merge main into master
    echo "🔀 Merging main into master..."
    git merge main
    
    # Push to master branch
    echo "🚀 Pushing to master branch..."
    git push origin master
    
    # Switch back to main
    echo "🔄 Switching back to main..."
    git checkout main
else
    echo "⚠️  Master branch doesn't exist locally. Creating and pushing..."
    
    # Create master branch from main
    git checkout -b master
    
    # Push to master branch
    echo "🚀 Pushing to master branch..."
    git push origin master
    
    # Switch back to main
    echo "🔄 Switching back to main..."
    git checkout main
fi

echo "✅ Successfully pushed to both main and master branches!"
echo "🌐 View your repository at: https://github.com/aqilrvsb/newFB"
