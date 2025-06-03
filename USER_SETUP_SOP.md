# 📋 SOP: Dynamic Facebook MCP Server Setup for 200 Users

## 🎯 Overview
This SOP guides each user to connect their Claude Desktop to the dynamic Facebook MCP server, enabling them to manage their Facebook ads directly through Claude.

---

## 📋 Prerequisites (What Each User Needs)

### ✅ Required Software:
- Claude Desktop installed
- Windows/Mac/Linux computer
- Internet connection

### 🔑 Required Facebook Credentials:
Users need these 4 Facebook credentials from their Meta for Developers account:
- **App ID** (e.g., `1234567890123456`)
- **App Secret** (e.g., `abcdef1234567890abcdef1234567890`)
- **Access Token** (e.g., `EAATNmAQBQ50BO...`)
- *(Account ID is automatically discovered)*

---

## 🚀 Step-by-Step Setup Process

### Step 1: Get Your User ID (One-Line Command)

**Option A: Windows (PowerShell/CMD)**
```bash
curl -X POST https://newfb-production.up.railway.app/auth -H "Content-Type: application/json" -d "{\"facebookAppId\":\"YOUR_APP_ID\",\"facebookAppSecret\":\"YOUR_APP_SECRET\",\"facebookAccessToken\":\"YOUR_ACCESS_TOKEN\"}"
```

**Option B: Mac/Linux (Terminal)**
```bash
curl -X POST https://newfb-production.up.railway.app/auth -H "Content-Type: application/json" -d '{"facebookAppId":"YOUR_APP_ID","facebookAppSecret":"YOUR_APP_SECRET","facebookAccessToken":"YOUR_ACCESS_TOKEN"}'
```

**Option C: Browser (Any Platform)**
Visit: `https://newfb-production.up.railway.app/` and use the authentication form

### Step 2: Replace Credentials & Run Command

**Example:**
```bash
curl -X POST https://newfb-production.up.railway.app/auth -H "Content-Type: application/json" -d "{\"facebookAppId\":\"1351952692757405\",\"facebookAppSecret\":\"92432bc79dfe9bbed3e40f6ceb88f43f\",\"facebookAccessToken\":\"EAATNmAQBQ50BOZCsIN27nMwfZC9KyEqmNdnloOMiABrnhhwEIbJ3wwUU9CeVSXIpIuAn69X0gNfby6eQ8yh4b4CznenZAJVSKlhhzxku8kZAsjrVuoTvzo7NZA0xhJZBk8ZBZCkwZA3Vr7zNBYET7g1RrdMotY4KEj4fPB9FWufmTs24aEN8ivvFLWV9JYQlBkT07\"}"
```

### Step 3: Copy Your User ID

**Success Response Example:**
```json
{
  "success": true,
  "userId": "abc123-def456-ghi789",
  "availableAccounts": [
    {"id": "act_1234567890", "name": "My Business Account"},
    {"id": "act_0987654321", "name": "My Personal Account"}
  ],
  "nextStep": "Configure Claude Desktop with your userId"
}
```

**❗ Important:** Copy your `userId` (e.g., `abc123-def456-ghi789`)

---

## 🔧 Step 4: Configure Claude Desktop

### Find Your Claude Desktop Config File:

**Windows:**
```
C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json
```

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/claude/claude_desktop_config.json
```

### Edit the Configuration File:

**If file doesn't exist, create it. If it exists, add the new server:**

```json
{
  "mcpServers": {
    "dynamic-facebook-ads": {
      "command": "node",
      "args": [
        "-e",
        "const https=require('https');const USER_ID='YOUR_USER_ID_HERE';let buffer='';async function processMessage(m){let r;if(m.method==='initialize'){r={jsonrpc:'2.0',id:m.id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'dynamic-facebook-ads',version:'2.0.0'}}}}else if(m.method==='notifications/initialized'||m.method==='notifications/cancelled'){return}else if(m.method==='tools/list'){r={jsonrpc:'2.0',id:m.id,result:{tools:[{name:'get_ad_accounts',description:'Get Facebook ad accounts',inputSchema:{type:'object',properties:{}}},{name:'select_ad_account',description:'Select Facebook ad account',inputSchema:{type:'object',properties:{accountId:{type:'string'}},required:['accountId']}},{name:'create_campaign',description:'Create Facebook campaign',inputSchema:{type:'object',properties:{name:{type:'string'},objective:{type:'string'},status:{type:'string'},special_ad_categories:{type:'array',items:{type:'string'}}},required:['name','objective','status','special_ad_categories']}},{name:'get_campaigns',description:'Get campaigns',inputSchema:{type:'object',properties:{limit:{type:'string'},status:{type:'string'}}}},{name:'get_campaign_details',description:'Get campaign details',inputSchema:{type:'object',properties:{campaignId:{type:'string'}},required:['campaignId']}},{name:'get_campaign_insights',description:'Get campaign analytics',inputSchema:{type:'object',properties:{campaignId:{type:'string'},since:{type:'string'},until:{type:'string'}},required:['campaignId','since','until']}}]}}}else if(m.method==='resources/list'){r={jsonrpc:'2.0',id:m.id,result:{resources:[]}}}else if(m.method==='prompts/list'){r={jsonrpc:'2.0',id:m.id,result:{prompts:[]}}}else if(m.method==='tools/call'){try{const req=https.request({hostname:'newfb-production.up.railway.app',port:443,path:`/mcp/${USER_ID}`,method:'POST',headers:{'Content-Type':'application/json'}},res=>{let data='';res.on('data',chunk=>data+=chunk);res.on('end',()=>{try{const result=JSON.parse(data);console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,result:{content:[{type:'text',text:JSON.stringify(result,null,2)}]}}))}catch(e){console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,error:{code:-1,message:e.message}}))}})});req.write(JSON.stringify({method:m.params.name,params:m.params.arguments}));req.end();return}catch(e){r={jsonrpc:'2.0',id:m.id,error:{code:-1,message:e.message}}}}else{r={jsonrpc:'2.0',id:m.id,error:{code:-32601,message:'Method not found'}}}if(r)console.log(JSON.stringify(r))}process.stdin.on('data',async data=>{buffer+=data.toString();const lines=buffer.split('\\n');buffer=lines.pop()||'';for(const line of lines){if(line.trim()){try{await processMessage(JSON.parse(line.trim()))}catch(e){console.error('Parse error:',e)}}}});process.stdin.on('end',()=>process.exit(0));console.error('MCP Client started for user:',USER_ID);"
      ]
    }
  }
}
```

### Replace YOUR_USER_ID_HERE:

**Example:**
```json
{
  "mcpServers": {
    "dynamic-facebook-ads": {
      "command": "node",
      "args": [
        "-e",
        "const https=require('https');const USER_ID='abc123-def456-ghi789';let buffer='';async function processMessage(m){..."
      ]
    }
  }
}
```

---

## 🎯 Step 5: Test Your Connection

1. **Close Claude Desktop completely**
2. **Restart Claude Desktop**
3. **Test with these commands:**
   - "What MCP tools are available?"
   - "Get my Facebook ad accounts"
   - "Show my Facebook campaigns"

---

## ✅ Available Tools After Setup

Once connected, users can use these **13 tools**:

1. **📋 get_ad_accounts** - Get all available Facebook ad accounts
2. **🎯 select_ad_account** - Select a Facebook ad account to use
3. **🚀 create_campaign** - Creates a new ad campaign
4. **📊 get_campaigns** - Lists existing campaigns
5. **🔍 get_campaign_details** - Gets details for a specific campaign
6. **✏️ update_campaign** - Updates an existing campaign
7. **🗑️ delete_campaign** - Deletes a campaign
8. **👥 create_custom_audience** - Creates a custom, website, or engagement audience
9. **📄 get_audiences** - Lists available custom audiences
10. **👥📈 create_lookalike_audience** - Creates a lookalike audience
11. **📢 create_ad_set** - Creates a new ad set
12. **📈 get_campaign_insights** - Retrieves performance insights for a campaign
13. **🤖 generate_campaign_prompt** - Generates a prompt for campaign creation using a template

---

## 🆘 Troubleshooting

### Common Issues:

**Issue:** "Authentication failed"
- ✅ **Solution:** Check your Facebook credentials are correct

**Issue:** "No tools showing in Claude Desktop"
- ✅ **Solution:** Ensure you replaced YOUR_USER_ID_HERE correctly
- ✅ **Solution:** Restart Claude Desktop completely

**Issue:** "Server at capacity"
- ✅ **Solution:** Try again later (200 user limit reached)

**Issue:** "Session expired"
- ✅ **Solution:** Re-run the authentication command to get new userId

### Support:
- Check server status: `https://newfb-production.up.railway.app/health`
- Re-authenticate if session expires (1 hour timeout)

---

## 🎉 Success Indicators

✅ Claude Desktop shows "dynamic-facebook-ads" in MCP servers
✅ You can ask "What Facebook accounts do I have?"
✅ Commands like "Create a Facebook campaign" work
✅ You can manage your Facebook ads through Claude

---

**🚀 You're now connected to the dynamic Facebook MCP server! Manage your Facebook ads directly through Claude Desktop.**