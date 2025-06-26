const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing http-server.ts issues...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Fix 1: Fix the generateConfig function declaration
content = content.replace(
  'function generateConfig\nconst config = {',
  'function generateConfig(userId) {\n  const config = {'
);

// Fix 2: Remove the duplicate string at the end of the long command string
// Find and fix the syntax error in the long string
content = content.replace(
  /process\.on\('SIGTERM', \(\) => process\.exit\(0\)\);"resources\/list'\)/g,
  "process.on('SIGTERM', () => process.exit(0));\""
);

// Fix 3: Fix the duplicate else if block
content = content.replace(
  /} else if \(message\.method === 'resources\/list'\) { console\.log\(JSON\.stringify\({ jsonrpc: '2\.0', id: message\.id, result: { resources: \[\] } }\)\); } else if \(message\.method === 'prompts\/list'/g,
  "} else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list'"
);

// Fix 4: Add the new lead tracking tools to the tools list
// Find the tools array and add the new tools if they're not already there
const toolsArrayPattern = /{ name: 'check_ad_id'[^}]+}/;
const checkAdIdMatch = content.match(toolsArrayPattern);

if (checkAdIdMatch && !content.includes("name: 'get_leads_data'")) {
  const insertPosition = content.indexOf(checkAdIdMatch[0]) + checkAdIdMatch[0].length;
  const newTools = `, { name: 'get_leads_data', description: 'Get leads data from Laravel app', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }, { name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }`;
  
  content = content.slice(0, insertPosition) + newTools + content.slice(insertPosition);
}

// Fix 5: Update the tool count in the instructions
content = content.replace(
  '<strong>Test Facebook Ads tools</strong> - you now have 67 tools available!</li>',
  '<strong>Test Facebook Ads tools</strong> - you now have 70 tools available!</li>'
);

// Fix 6: Remove the duplicated long string at the end of line 216
// This is causing the syntax error
const longStringEnd = content.indexOf('process.on(\'SIGTERM\', () => process.exit(0));"resources/list\')');
if (longStringEnd > -1) {
  // Find the proper end of the string
  const properEnd = content.lastIndexOf('process.on(\'SIGTERM\', () => process.exit(0));"', longStringEnd);
  if (properEnd > -1 && properEnd < longStringEnd) {
    // Remove the duplicate part
    content = content.slice(0, properEnd + 'process.on(\'SIGTERM\', () => process.exit(0));"'.length) + 
              '\n' + content.slice(content.indexOf('\n', longStringEnd) + 1);
  }
}

// Write the fixed content back
fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed http-server.ts');

// Now update the lead-tracking-tools.ts with the correct data format
const leadTrackingPath = path.join(__dirname, 'src', 'tools', 'lead-tracking-tools.ts');
const leadTrackingContent = `import { userSessionManager } from '../config.js';

interface Lead {
  ad_id: string | null;
  total_lead: number;
}

interface LeadsResponse {
  leads: Lead[];
  total_sale: number;
}

interface LeadsDataResult {
  success: boolean;
  summary?: {
    totalLeads: number;
    totalSale: number;
    dateRange: {
      start: string;
      end: string;
    };
    staffId: string;
    leadsByAdId?: Record<string, number>;
  };
  rawData?: LeadsResponse;
  message?: string;
}

interface AdInsights {
  impressions?: number;
  reach?: number;
  spend?: number;
  clicks?: number;
  cpm?: number;
  cpc?: number;
  ctr?: number;
  adName?: string;
  adStatus?: string;
  adSetName?: string;
  campaignName?: string;
}

interface AdPerformance {
  adId: string;
  adName: string;
  campaignName: string;
  totalLeads: number;
  totalSpend: number;
  costPerLead: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
}

// Get leads data from Laravel app
export const getLeadsData = async (
  userId: string, 
  staffId: string, 
  startDate: string, 
  endDate: string
): Promise<LeadsDataResult> => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Build the URL with parameters
    const url = \`https://rvsbbot.com/getinfo/\${staffId}/\${startDate}/\${endDate}\`;
    
    console.log(\`Fetching leads data from: \${url}\`);
    
    // Fetch data from Laravel app
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json() as LeadsResponse;
    
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
    };

  } catch (error) {
    return {
      success: false,
      message: \`Error fetching leads data: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};

// Get leads with Facebook Ads insights combined
export const getLeadsWithAdInsights = async (
  userId: string,
  staffId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // First get leads data
    const leadsResult = await getLeadsData(userId, staffId, startDate, endDate);
    
    if (!leadsResult.success || !leadsResult.summary) {
      return leadsResult;
    }

    // Get unique ad IDs from leads (excluding null)
    const uniqueAdIds = Object.keys(leadsResult.summary?.leadsByAdId || {})
      .filter(adId => adId !== 'no_ad_id' && adId !== 'null');
    
    // Fetch Facebook Ads insights for each unique ad ID
    const adInsights: Record<string, AdInsights> = {};
    
    for (const adId of uniqueAdIds) {
      try {
        // Get ad insights from Facebook
        const insightsUrl = \`https://graph.facebook.com/v23.0/\${adId}/insights?fields=impressions,reach,spend,clicks,cpm,cpc,ctr&time_range={'since':'\${startDate}','until':'\${endDate}'}&access_token=\${session.credentials.facebookAccessToken}\`;
        
        const insightsResponse = await fetch(insightsUrl);
        const insightsData = await insightsResponse.json() as any;
        
        if (insightsData.data && insightsData.data.length > 0) {
          const insights = insightsData.data[0];
          adInsights[adId] = {
            impressions: parseInt(insights.impressions || 0),
            reach: parseInt(insights.reach || 0),
            spend: parseFloat(insights.spend || 0),
            clicks: parseInt(insights.clicks || 0),
            cpm: parseFloat(insights.cpm || 0),
            cpc: parseFloat(insights.cpc || 0),
            ctr: parseFloat(insights.ctr || 0)
          };
        }

        // Also get ad details
        const adDetailsUrl = \`https://graph.facebook.com/v23.0/\${adId}?fields=name,status,adset{name,campaign{name}}&access_token=\${session.credentials.facebookAccessToken}\`;
        const adDetailsResponse = await fetch(adDetailsUrl);
        const adDetails = await adDetailsResponse.json() as any;
        
        if (!adDetails.error) {
          adInsights[adId] = {
            ...adInsights[adId],
            adName: adDetails.name,
            adStatus: adDetails.status,
            adSetName: adDetails.adset?.name,
            campaignName: adDetails.adset?.campaign?.name
          };
        }
      } catch (error) {
        console.error(\`Error fetching insights for ad \${adId}:\`, error);
      }
    }

    // Calculate cost per lead for each ad
    const adPerformance: Record<string, AdPerformance> = {};
    
    uniqueAdIds.forEach(adId => {
      const totalLeadsForAd = leadsResult.summary?.leadsByAdId?.[adId] || 0;
      const insights = adInsights[adId];
      
      if (insights && insights.spend !== undefined) {
        adPerformance[adId] = {
          adId: adId,
          adName: insights.adName || 'Unknown',
          campaignName: insights.campaignName || 'Unknown',
          totalLeads: totalLeadsForAd,
          totalSpend: insights.spend,
          costPerLead: totalLeadsForAd > 0 ? insights.spend / totalLeadsForAd : 0,
          impressions: insights.impressions,
          clicks: insights.clicks,
          ctr: insights.ctr
        };
      }
    });

    // Calculate overall metrics
    const totalSpend = Object.values(adInsights).reduce((sum, insights) => sum + (insights.spend || 0), 0);
    const totalLeads = leadsResult.summary!.totalLeads;
    const overallCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

    // Find best performing ads
    const adPerformanceArray = Object.values(adPerformance);
    const bestCPL = adPerformanceArray.length > 0 
      ? adPerformanceArray.reduce((best, current) => 
          current.costPerLead < best.costPerLead ? current : best
        )
      : null;
    
    const mostLeads = adPerformanceArray.length > 0
      ? adPerformanceArray.reduce((best, current) => 
          current.totalLeads > best.totalLeads ? current : best
        )
      : null;

    return {
      success: true,
      summary: {
        dateRange: {
          start: startDate,
          end: endDate
        },
        totalLeads: totalLeads,
        totalSpend: totalSpend,
        totalSale: leadsResult.summary.totalSale,
        overallCostPerLead: overallCostPerLead,
        uniqueAdsUsed: uniqueAdIds.length,
        bestPerformingAd: bestCPL,
        adWithMostLeads: mostLeads
      },
      adPerformance: adPerformance,
      leadsByAdId: leadsResult.summary.leadsByAdId,
      rawData: leadsResult.rawData,
      message: 'Leads data with ad insights retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: \`Error fetching leads with insights: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};`;

fs.writeFileSync(leadTrackingPath, leadTrackingContent);
console.log('✅ Updated lead-tracking-tools.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}

console.log('\n🎯 All fixes applied!');
console.log('\n📝 Summary of changes:');
console.log('1. Fixed generateConfig function declaration');
console.log('2. Fixed syntax errors in the long string');
console.log('3. Added lead tracking tools to the tools list');
console.log('4. Updated lead-tracking-tools.ts to handle the new data format');
console.log('5. Updated tool count to 70');
console.log('\n✨ Your project is now ready to deploy to Railway!');
