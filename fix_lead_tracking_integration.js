const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Lead Tracking Tools Integration...\n');

// Fix 1: Update lead-tracking-tools.ts to handle the new data format
const leadTrackingToolsPath = path.join(__dirname, 'src', 'tools', 'lead-tracking-tools.ts');
let leadTrackingContent = fs.readFileSync(leadTrackingToolsPath, 'utf8');

// Update the interface to match the actual data format from Laravel
const oldInterface = `interface Lead {
  prospect_nama: string;
  prospect_num: string;
  date_order: string;
  keywordiklan: string;
  url: string;
  ad_id: string | number;
}`;

const newInterface = `interface Lead {
  ad_id: string | null;
  total_lead: number;
}

interface LeadsResponse {
  leads: Lead[];
  total_sale: number;
}`;

leadTrackingContent = leadTrackingContent.replace(oldInterface, newInterface);

// Update the getLeadsData function to handle the new format
leadTrackingContent = leadTrackingContent.replace(
  /const leadsData = await response\.json\(\) as Lead\[\];[\s\S]*?return \{[\s\S]*?success: true,[\s\S]*?\};/,
  `const data = await response.json() as LeadsResponse;
    
    if (!data || !data.leads) {
      return {
        success: false,
        message: 'Invalid response format from server'
      };
    }

    // Process the leads data
    const leadsByAdId: Record<string, number> = {};
    let totalLeads = 0;

    data.leads.forEach(lead => {
      const adId = lead.ad_id || 'no_ad_id';
      leadsByAdId[adId] = lead.total_lead;
      totalLeads += lead.total_lead;
    });

    return {
      success: true,
      summary: {
        totalLeads: totalLeads,
        totalSale: data.total_sale,
        dateRange: {
          start: startDate,
          end: endDate
        },
        staffId: staffId,
        leadsByAdId: leadsByAdId
      },
      rawData: data,
      message: 'Leads data retrieved successfully'
    };`
);

// Update the getLeadsWithAdInsights function
leadTrackingContent = leadTrackingContent.replace(
  /\/\/ Get unique ad IDs from leads[\s\S]*?const uniqueAdIds = \[\.\.\.new Set\(leadsResult\.leads\.map\(lead => String\(lead\.ad_id\)\)\)\];/,
  `// Get unique ad IDs from leads (excluding null)
    const uniqueAdIds = Object.keys(leadsResult.summary?.leadsByAdId || {})
      .filter(adId => adId !== 'no_ad_id' && adId !== 'null');`
);

// Fix the performance calculation
leadTrackingContent = leadTrackingContent.replace(
  /uniqueAdIds\.forEach\(adId => \{[\s\S]*?const leadsForAd = leadsResult\.leadsByAdId!\[adId\];/,
  `uniqueAdIds.forEach(adId => {
      const totalLeadsForAd = leadsResult.summary?.leadsByAdId?.[adId] || 0;`
);

leadTrackingContent = leadTrackingContent.replace(
  /totalLeads: leadsForAd\.length,/g,
  'totalLeads: totalLeadsForAd,'
);

leadTrackingContent = leadTrackingContent.replace(
  /leads: leadsForAd/g,
  'leadCount: totalLeadsForAd'
);

fs.writeFileSync(leadTrackingToolsPath, leadTrackingContent);
console.log('✅ Updated lead-tracking-tools.ts');

// Fix 2: Update http-server.ts import statement
const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let httpServerContent = fs.readFileSync(httpServerPath, 'utf8');

// Fix the incomplete import
httpServerContent = httpServerContent.replace(
  'import * as leadTrackingTools',
  "import * as leadTrackingTools from './tools/lead-tracking-tools.js';"
);

fs.writeFileSync(httpServerPath, httpServerContent);
console.log('✅ Fixed http-server.ts import');

// Fix 3: Update the get-user-id HTML file
const getUserIdPath = path.join(__dirname, 'dist', 'get-user-id.html');
if (fs.existsSync(getUserIdPath)) {
  let getUserIdContent = fs.readFileSync(getUserIdPath, 'utf8');
  
  // Fix the syntax error in the long string
  getUserIdContent = getUserIdContent.replace(
    /process\.on\('SIGTERM', \(\) => process\.exit\(0\)\);"resources\/list'\)/g,
    "process.on('SIGTERM', () => process.exit(0));\""
  );
  
  // Also fix the duplicate else if block
  getUserIdContent = getUserIdContent.replace(
    /} else if \(message\.method === 'resources\/list'\) { console\.log\(JSON\.stringify\({ jsonrpc: '2\.0', id: message\.id, result: { resources: \[\] } }\)\); } else if \(message\.method === 'prompts\/list'/g,
    "} else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list'"
  );
  
  fs.writeFileSync(getUserIdPath, getUserIdContent);
  console.log('✅ Fixed get-user-id.html syntax error');
}

console.log('\n🎯 All fixes applied successfully!');
console.log('\n📦 Next steps:');
console.log('1. Run: npm run build');
console.log('2. Deploy to Railway');
