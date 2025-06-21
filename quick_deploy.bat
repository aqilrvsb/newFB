@echo off
echo Deploying to Railway via GitHub...

REM Add all changes
git add -A

REM Commit with timestamp
git commit -m "Deploy: %date% %time%" -m "Auto-deployment to Railway"

REM Push to both main and master branches
git push origin main --force
git push origin main:master --force

echo.
echo ✅ Deployment complete!
echo Railway should auto-deploy from main branch now.
pause
