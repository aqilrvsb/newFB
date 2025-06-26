# Force push to GitHub without pull requests
Write-Host "🚀 Starting force push to GitHub..." -ForegroundColor Green

# First, make sure we're in the right directory
Set-Location "C:\Users\ROGSTRIX\Documents\newFB-main"

# Add all changes
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add -A

# Commit with descriptive message
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "🔧 Remove smart token implementation - Direct token usage

- Removed all smart token functions and helpers
- Updated replyToComment to use page token
- Updated deleteComment to use page token  
- Updated getPostMetrics to use page token (affects all insights)
- Updated sendDmToUser to use page token with pageId param
- Removed 5 smart token tools from HTTP server
- All 68 tools now use appropriate tokens directly"

# Add remote if not exists
Write-Host "🔗 Setting up remote..." -ForegroundColor Yellow
git remote add origin https://github.com/aqilrvsb/newFB.git 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote already exists" -ForegroundColor Gray
}

# Force push to main branch
Write-Host "📤 Force pushing to main branch..." -ForegroundColor Yellow
git push origin main --force

# Also push to master branch
Write-Host "📤 Force pushing to master branch..." -ForegroundColor Yellow
git push origin main:master --force

Write-Host "✅ Force push completed! No pull requests needed." -ForegroundColor Green
Write-Host "🚀 Railway should auto-deploy from master branch" -ForegroundColor Cyan
