#!/bin/bash
# One-liner authentication for Mac/Linux users

echo "🔐 Facebook MCP Authentication Tool"
echo "=================================="
echo ""

read -p "Enter your Facebook App ID: " APP_ID
read -p "Enter your Facebook App Secret: " APP_SECRET
read -p "Enter your Facebook Access Token: " ACCESS_TOKEN

echo ""
echo "🚀 Authenticating with server..."

RESPONSE=$(curl -s -X POST https://newfb-production.up.railway.app/auth \
  -H "Content-Type: application/json" \
  -d "{\"facebookAppId\":\"$APP_ID\",\"facebookAppSecret\":\"$APP_SECRET\",\"facebookAccessToken\":\"$ACCESS_TOKEN\"}")

echo "📥 Server Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Extract userId if successful
USER_ID=$(echo "$RESPONSE" | grep -o '"userId":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$USER_ID" ]; then
    echo ""
    echo "✅ SUCCESS! Your User ID: $USER_ID"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy this User ID: $USER_ID"
    echo "2. Add it to your Claude Desktop config"
    echo "3. Replace YOUR_USER_ID_HERE with: $USER_ID"
    echo ""
    echo "🔗 Claude Desktop config location:"
    echo "Mac: ~/Library/Application Support/Claude/claude_desktop_config.json"
    echo "Linux: ~/.config/claude/claude_desktop_config.json"
else
    echo ""
    echo "❌ Authentication failed. Please check your credentials and try again."
fi