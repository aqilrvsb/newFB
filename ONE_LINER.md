# 🚀 QUICK ONE-LINER AUTHENTICATION

## For Windows (CMD/PowerShell):
```cmd
curl -X POST https://newfb-production.up.railway.app/auth -H "Content-Type: application/json" -d "{\"facebookAppId\":\"YOUR_APP_ID\",\"facebookAppSecret\":\"YOUR_APP_SECRET\",\"facebookAccessToken\":\"YOUR_ACCESS_TOKEN\"}"
```

## For Mac/Linux (Terminal):
```bash
curl -X POST https://newfb-production.up.railway.app/auth -H 'Content-Type: application/json' -d '{"facebookAppId":"YOUR_APP_ID","facebookAppSecret":"YOUR_APP_SECRET","facebookAccessToken":"YOUR_ACCESS_TOKEN"}'
```

## Example (Replace with your credentials):
```bash
curl -X POST https://newfb-production.up.railway.app/auth -H 'Content-Type: application/json' -d '{"facebookAppId":"1351952692757405","facebookAppSecret":"92432bc79dfe9bbed3e40f6ceb88f43f","facebookAccessToken":"EAATNmAQBQ50BOZCsIN27nMwfZC9KyEqmNdnloOMiABrnhhwEIbJ3wwUU9CeVSXIpIuAn69X0gNfby6eQ8yh4b4CznenZAJVSKlhhzxku8kZAsjrVuoTvzo7NZA0xhJZBk8ZBZCkwZA3Vr7zNBYET7g1RrdMotY4KEj4fPB9FWufmTs24aEN8ivvFLWV9JYQlBkT07"}'
```

## Expected Response:
```json
{
  "success": true,
  "userId": "abc123-def456-ghi789",
  "availableAccounts": [...],
  "nextStep": "Configure Claude Desktop"
}
```

## Next: Use the userId in Claude Desktop config!