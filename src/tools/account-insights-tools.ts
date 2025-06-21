import { userSessionManager } from '../config.js';

const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
const { AdAccount } = require('facebook-nodejs-business-sdk');
const { User } = require('facebook-nodejs-business-sdk');

interface AccountInsight {
  spend: string;
  impressions: string;
  clicks: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  account_id: string;
  account_name: string;
}

interface AccountSpendSummary {
  accountId: string;
  accountName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  currency: string;
}

// Get insights for a single ad account
export const getAccountInsights = async (
  userId: string,
  accountId: string,
  dateRange: string = 'today'
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Check if dateRange contains a comma (custom date range)
    let params: any = {};
    
    if (dateRange.includes(' to ') || dateRange.includes('_to_')) {
      // Custom date range format: "16-06-2025 to 18-06-2025" or "16-06-2025_to_18-06-2025"
      const separator = dateRange.includes('_to_') ? '_to_' : ' to ';
      const [start, end] = dateRange.split(separator);
      // Convert DD-MM-YYYY to YYYY-MM-DD
      const startParts = start.trim().split('-');
      const endParts = end.trim().split('-');
      params.time_range = {
        since: `${startParts[2]}-${startParts[1]}-${startParts[0]}`,
        until: `${endParts[2]}-${endParts[1]}-${endParts[0]}`
      };
    } else if (dateRange.includes(',')) {
      // Custom date range format: "2025-06-01,2025-06-21"
      const [startDate, endDate] = dateRange.split(',');
      params.time_range = {
        since: startDate.trim(),
        until: endDate.trim()
      };
    } else {
      // Map dateRange to Facebook's valid date_preset values  
      const datePresetMap = {
        'today': 'today',
        'yesterday': 'yesterday', 
        'last_7_days': 'last_7_days',
        'last_30_days': 'last_30_days'
      };
      
      const validDateRange = datePresetMap[dateRange as keyof typeof datePresetMap] || 'today';
      params.date_preset = validDateRange;
    }
    // Initialize SDK with user's access token
    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    
    // Create AdAccount instance
    const adAccount = new AdAccount(accountId);
    
    // Get insights using SDK
    const fields = ['spend', 'impressions', 'clicks', 'cpm', 'cpc', 'ctr'];
    
    const insights = await adAccount.getInsights(fields, params);
    
    if (!insights || insights.length === 0) {
      return {
        success: true,
        accountId: accountId,
        dateRange: dateRange,
        insights: {
          spend: 0,
          impressions: 0,
          clicks: 0,
          cpm: 0,
          cpc: 0,
          ctr: 0
        },
        message: 'No data available for the selected date range'
      };
    }

    const insight = insights[0];
    
    return {
      success: true,
      accountId: accountId,
      dateRange: dateRange,
      insights: {
        spend: parseFloat(insight.spend || '0'),
        impressions: parseInt(insight.impressions || '0'),
        clicks: parseInt(insight.clicks || '0'),
        cpm: parseFloat(insight.cpm || '0'),
        cpc: parseFloat(insight.cpc || '0'),
        ctr: parseFloat(insight.ctr || '0')
      },
      currency: insight.account_currency || 'MYR',
      message: 'Account insights retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,      message: `Error getting account insights: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get total spend across all ad accounts
export const getTotalSpendAllAccounts = async (
  userId: string,
  dateRange: string = 'today'
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Initialize SDK
    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    
    // Get user's ad accounts using SDK
    const user = new User('me');
    const accountsData = await user.getAdAccounts(
      ['id', 'name', 'currency', 'account_status'],
      { limit: 100 }
    );
    
    if (!accountsData || accountsData.length === 0) {
      return {
        success: false,
        message: 'No ad accounts found'
      };
    }

    // Filter active accounts only
    const activeAccounts = accountsData.filter((account: any) => 
      account.account_status === 1 || account.account_status === 2
    );

    if (activeAccounts.length === 0) {
      return {
        success: true,
        dateRange: dateRange,
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        overallCPM: 0,
        overallCPC: 0,
        overallCTR: 0,
        accountCount: 0,
        accounts: [],
        message: 'No active ad accounts found'
      };
    }
    // Get insights for each account
    const accountInsights: AccountSpendSummary[] = [];
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    
    for (const account of activeAccounts) {
      try {
        // Create AdAccount instance
        const adAccount = new AdAccount(account.id);
        
        // Get insights using SDK
        const fields = ['spend', 'impressions', 'clicks', 'cpm', 'cpc', 'ctr'];
        let params: any = {};
        
        // Check if dateRange is a custom format
        if (dateRange.includes(' to ') || dateRange.includes('_to_')) {
          // Custom date range format: "16-06-2025 to 18-06-2025" or "16-06-2025_to_18-06-2025"
          const separator = dateRange.includes('_to_') ? '_to_' : ' to ';
          const [start, end] = dateRange.split(separator);
          // Convert DD-MM-YYYY to YYYY-MM-DD
          const startParts = start.trim().split('-');
          const endParts = end.trim().split('-');
          params.time_range = {
            since: `${startParts[2]}-${startParts[1]}-${startParts[0]}`,
            until: `${endParts[2]}-${endParts[1]}-${endParts[0]}`
          };
        } else if (dateRange.includes(',')) {
          // Custom date range format: "2025-06-01,2025-06-21"
          const [startDate, endDate] = dateRange.split(',');
          params.time_range = {
            since: startDate.trim(),
            until: endDate.trim()
          };
        } else {
          // Use Facebook's date preset
          params.date_preset = dateRange;
        }
        
        const insightsData = await adAccount.getInsights(fields, params);
        
        if (insightsData && insightsData.length > 0) {
          const insight = insightsData[0];
          const spend = parseFloat(insight.spend || '0');
          const impressions = parseInt(insight.impressions || '0');
          const clicks = parseInt(insight.clicks || '0');
          
          if (spend > 0) {
            accountInsights.push({
              accountId: account.id,
              accountName: account.name,              spend: spend,
              impressions: impressions,
              clicks: clicks,
              cpm: parseFloat(insight.cpm || '0'),
              cpc: parseFloat(insight.cpc || '0'),
              ctr: parseFloat(insight.ctr || '0'),
              currency: account.currency
            });
            
            totalSpend += spend;
            totalImpressions += impressions;
            totalClicks += clicks;
          }
        }
      } catch (error) {
        console.error(`Error getting insights for account ${account.id}:`, error);
      }
    }

    // Calculate overall metrics
    const overallCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const overallCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Sort accounts by spend (highest first)
    accountInsights.sort((a, b) => b.spend - a.spend);

    return {
      success: true,
      dateRange: dateRange,      totalSpend: totalSpend,
      totalImpressions: totalImpressions,
      totalClicks: totalClicks,
      overallCPM: overallCPM,
      overallCPC: overallCPC,
      overallCTR: overallCTR,
      accountCount: accountInsights.length,
      accounts: accountInsights,
      message: `Found ${accountInsights.length} accounts with spend totaling ${totalSpend.toFixed(2)} MYR`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting total spend: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get spend breakdown by campaign across all accounts
export const getSpendByCampaign = async (
  userId: string,
  dateRange: string = 'today'
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Initialize SDK
    FacebookAdsApi.init(session.credentials.facebookAccessToken);    
    // Get user's ad accounts
    const user = new User('me');
    const accountsData = await user.getAdAccounts(
      ['id', 'name', 'currency', 'account_status'],
      { limit: 100 }
    );
    
    if (!accountsData || accountsData.length === 0) {
      return {
        success: false,
        message: 'No ad accounts found'
      };
    }

    // Filter active accounts
    const activeAccounts = accountsData.filter((account: any) => 
      account.account_status === 1 || account.account_status === 2
    );

    if (activeAccounts.length === 0) {
      return {
        success: true,
        dateRange: dateRange,
        totalSpend: 0,
        campaignCount: 0,
        campaigns: [],
        message: 'No active ad accounts found'
      };
    }

    const allCampaigns: any[] = [];
    let totalSpend = 0;    
    for (const account of activeAccounts) {
      try {
        // Create AdAccount instance
        const adAccount = new AdAccount(account.id);
        
        // Get campaigns with insights using SDK
        const fields = ['id', 'name', 'status', 'objective'];
        const insightFields = ['spend', 'impressions', 'clicks', 'cpm', 'cpc', 'ctr'];
        const params = {
          fields: fields.concat([`insights.date_preset(${dateRange}){${insightFields.join(',')}}`]).join(','),
          limit: 100
        };
        
        const campaignsData = await adAccount.getCampaigns(fields, params);
        
        // Now get insights for each campaign
        for (const campaign of campaignsData) {
          try {
            // Build params for campaign insights based on date range
            let campaignParams: any = {};
            
            if (dateRange.includes(' to ') || dateRange.includes('_to_')) {
              // Custom date range format
              const separator = dateRange.includes('_to_') ? '_to_' : ' to ';
              const [start, end] = dateRange.split(separator);
              const startParts = start.trim().split('-');
              const endParts = end.trim().split('-');
              campaignParams.time_range = {
                since: `${startParts[2]}-${startParts[1]}-${startParts[0]}`,
                until: `${endParts[2]}-${endParts[1]}-${endParts[0]}`
              };
            } else if (dateRange.includes(',')) {
              const [startDate, endDate] = dateRange.split(',');
              campaignParams.time_range = {
                since: startDate.trim(),
                until: endDate.trim()
              };
            } else {
              campaignParams.date_preset = dateRange;
            }
            
            const campaignInsights = await campaign.getInsights(insightFields, campaignParams);
            
            if (campaignInsights && campaignInsights.length > 0) {
              const insight = campaignInsights[0];
              const spend = parseFloat(insight.spend || '0');
              
              if (spend > 0) {
                allCampaigns.push({
                  campaignId: campaign.id,
                  campaignName: campaign.name,
                  accountId: account.id,                  accountName: account.name,
                  status: campaign.status,
                  objective: campaign.objective,
                  spend: spend,
                  impressions: parseInt(insight.impressions || '0'),
                  clicks: parseInt(insight.clicks || '0'),
                  cpm: parseFloat(insight.cpm || '0'),
                  cpc: parseFloat(insight.cpc || '0'),
                  ctr: parseFloat(insight.ctr || '0')
                });
                
                totalSpend += spend;
              }
            }
          } catch (campaignError) {
            console.error(`Error getting insights for campaign ${campaign.id}:`, campaignError);
          }
        }
      } catch (error) {
        console.error(`Error getting campaigns for account ${account.id}:`, error);
      }
    }

    // Sort campaigns by spend (highest first)
    allCampaigns.sort((a, b) => b.spend - a.spend);

    return {
      success: true,
      dateRange: dateRange,
      totalSpend: totalSpend,      campaignCount: allCampaigns.length,
      campaigns: allCampaigns,
      message: `Found ${allCampaigns.length} campaigns with spend totaling ${totalSpend.toFixed(2)} MYR`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting spend by campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};