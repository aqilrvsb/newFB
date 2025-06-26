@echo off
REM One-liner authentication for Windows users

echo 🔐 Facebook MCP Authentication Tool
echo ==================================
echo.

set /p APP_ID="Enter your Facebook App ID: "
set /p APP_SECRET="Enter your Facebook App Secret: "
set /p ACCESS_TOKEN="Enter your Facebook Access Token: "

echo.
echo 🚀 Authenticating with server...

curl -X POST https://newfb-production.up.railway.app/auth -H "Content-Type: application/json" -d "{\"facebookAppId\":\"%APP_ID%\",\"facebookAppSecret\":\"%APP_SECRET%\",\"facebookAccessToken\":\"%ACCESS_TOKEN%\"}" > response.json

echo.
echo 📥 Server Response:
type response.json
echo.

echo.
echo 📋 Next Steps:
echo 1. Copy the userId from the response above
echo 2. Edit your Claude Desktop config file:
echo    %APPDATA%\Claude\claude_desktop_config.json
echo 3. Replace YOUR_USER_ID_HERE with your actual userId
echo.
echo ✅ If successful, restart Claude Desktop and test with:
echo    "What MCP tools are available?"

del response.json
pause