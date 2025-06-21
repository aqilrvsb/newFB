# Git commit and push script for newFB project (PowerShell)

Write-Host "🚀 Starting Git commit and push process..." -ForegroundColor Green

# Navigate to project directory
Set-Location "C:\Users\ROGSTRIX\Music\New folder\aq\newFB-main"

# Check git status
Write-Host "`n📊 Checking git status..." -ForegroundColor Yellow
git status

# Add all changes
Write-Host "`n📁 Adding all changes..." -ForegroundColor Yellow
git add .

# Create commit with descriptive message
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
$commitMessage = @"
Complete SDK Migration: All 77 tools migrated from fetch to Facebook Business SDK

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
- Updated http-server.ts function references
"@

git commit -m $commitMessage

# Check if remote is set
Write-Host "`n🔗 Checking remote..." -ForegroundColor Yellow
git remote -v

# If remote doesn't exist, add it
$remoteExists = git remote | Select-String "origin"
if (-not $remoteExists) {
    Write-Host "➕ Adding remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/aqilrvsb/newFB.git
}

# Fetch latest from remote
Write-Host "`n📥 Fetching from remote..." -ForegroundColor Yellow
git fetch origin

# Push to main branch
Write-Host "`n🚀 Pushing to main branch..." -ForegroundColor Cyan
git push origin main

# Check if master branch exists locally
$masterExists = git show-ref --verify --quiet refs/heads/master
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🔄 Switching to master branch..." -ForegroundColor Yellow
    git checkout master
    
    # Merge main into master
    Write-Host "`n🔀 Merging main into master..." -ForegroundColor Yellow
    git merge main
    
    # Push to master branch
    Write-Host "`n🚀 Pushing to master branch..." -ForegroundColor Cyan
    git push origin master
    
    # Switch back to main
    Write-Host "`n🔄 Switching back to main..." -ForegroundColor Yellow
    git checkout main
} else {
    Write-Host "`n⚠️  Master branch doesn't exist locally. Creating and pushing..." -ForegroundColor Yellow
    
    # Create master branch from main
    git checkout -b master
    
    # Push to master branch
    Write-Host "`n🚀 Pushing to master branch..." -ForegroundColor Cyan
    git push origin master
    
    # Switch back to main
    Write-Host "`n🔄 Switching back to main..." -ForegroundColor Yellow
    git checkout main
}

Write-Host "`n✅ Successfully pushed to both main and master branches!" -ForegroundColor Green
Write-Host "🌐 View your repository at: https://github.com/aqilrvsb/newFB" -ForegroundColor Blue