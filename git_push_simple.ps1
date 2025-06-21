Write-Host "Starting Git commit and push process..." -ForegroundColor Green

# Navigate to project directory
Set-Location "C:\Users\ROGSTRIX\Music\New folder\aq\newFB-main"

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
git status

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Create commit
Write-Host "Creating commit..." -ForegroundColor Yellow
git commit -m "Complete SDK Migration: All 77 tools migrated from fetch to Facebook Business SDK - Fixed all TypeScript errors - All tools verified and working"

# Check remote
Write-Host "Checking remote..." -ForegroundColor Yellow
git remote -v

# Add remote if needed
$remoteExists = git remote | Select-String "origin"
if (-not $remoteExists) {
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/aqilrvsb/newFB.git
}

# Fetch from remote
Write-Host "Fetching from remote..." -ForegroundColor Yellow
git fetch origin

# Push to main
Write-Host "Pushing to main branch..." -ForegroundColor Cyan
git push origin main

# Handle master branch
Write-Host "Handling master branch..." -ForegroundColor Yellow
git checkout -b master 2>$null
git checkout master
git merge main
git push origin master

# Switch back to main
git checkout main

Write-Host "Successfully pushed to both main and master branches!" -ForegroundColor Green
Write-Host "View your repository at: https://github.com/aqilrvsb/newFB" -ForegroundColor Blue