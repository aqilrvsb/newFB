import { userSessionManager } from '../config.js';
import { getLeadsData } from './lead-tracking-tools.js';
import { getAccountInsights } from './account-insights-tools.js';
import { checkAdId } from './ad-tools.js';

const { FacebookAdsApi, Ad, AdSet } = require('facebook-nodejs-business-sdk');

// New interfaces for the modified lead report
interface UserAdData {
  user_id: string;
  date: string;
  ads: Array<{ ad_id: string }>;
}

interface AdPerformanceReport {
  user_id: string;
  date: string;
  ad_id: string;
  adName: string;
  campaignName: string;
  adSetName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  ctr: number;
  reach?: number;
  frequency?: number;
  inline_link_clicks?: number;
  inline_link_click_ctr?: number;
  cost_per_inline_link_click?: number;
}

interface AdPerformanceSummary {
  totalUsers: number;
  totalAds: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  averageCPM: number;
  averageCTR: number;
  date: string;
}

interface LeadData {
  ad_id: string | null;
  url: string | null;
  total_lead: number;
  total_customer: number;
  total_price: number;
}

interface LeadReport {
  adId: string | null;
  adName: string;
  postUrl: string | null;
  budgetAds: number;
  amountSpent: number;
  totalLead: number;
  costPerLead: number;
  cpm: number;
  ctr: number;
  ctrLinkClick: number;
  totalCustomer: number;
  totalPrice: number;
  roas: number;
  campaignName?: string;
  adSetName?: string;
}

export const getLeadReport = async (
  userId: string,
  adDataArray: UserAdData[] // New parameter structure
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Initialize SDK
    FacebookAdsApi.init(session.credentials.facebookAccessToken);

    if (!adDataArray || adDataArray.length === 0) {
      return {
        success: false,
        message: 'No ad data provided'
      };
    }

    const reports: AdPerformanceReport[] = [];
    const errors: string[] = [];
    
    console.log(`Processing ${adDataArray.length} users with ads data...`);

    // Process each user's ads
    for (const userData of adDataArray) {
      console.log(`Processing user ${userData.user_id} with ${userData.ads.length} ads for date ${userData.date}`);
      
      // Convert date from DD-MM-YYYY to YYYY-MM-DD for Facebook API
      const dateParts = userData.date.split('-');
      const fbDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      
      // Process each ad for this user
      for (const adData of userData.ads) {
        try {
          const ad = new Ad(adData.ad_id);
          
          // Get ad details (name, hierarchy)
          let adName = 'Unknown Ad';
          let campaignName = 'Unknown Campaign';
          let adSetName = 'Unknown Ad Set';
          
          try {
            const adDetails = await ad.get([
              'name', 
              'adset{id,name,campaign{id,name}}'
            ]);
            
            adName = adDetails.name || `Ad ${adData.ad_id}`;
            campaignName = adDetails.adset?.campaign?.name || 'Unknown Campaign';
            adSetName = adDetails.adset?.name || 'Unknown Ad Set';
          } catch (detailError) {
            console.warn(`Could not get details for ad ${adData.ad_id}:`, detailError);
          }

          // Get performance insights for the specific date
          const insightsParams = {
            time_range: {
              since: fbDate,
              until: fbDate  // Same day for single date
            }
          };
          
          const insights = await ad.getInsights([
            'spend',
            'impressions', 
            'clicks',
            'cpm',
            'ctr',
            'reach',
            'frequency',
            'inline_link_clicks',
            'inline_link_click_ctr',
            'cost_per_inline_link_click'
          ], insightsParams);

          // Create report entry
          const report: AdPerformanceReport = {
            user_id: userData.user_id,
            date: userData.date,
            ad_id: adData.ad_id,
            adName: adName,
            campaignName: campaignName,
            adSetName: adSetName,
            spend: 0,
            impressions: 0,
            clicks: 0,
            cpm: 0,
            ctr: 0
          };

          // Fill in insights data if available
          if (insights && insights.length > 0) {
            const insight = insights[0];
            
            report.spend = parseFloat(insight.spend || '0');
            report.impressions = parseInt(insight.impressions || '0');
            report.clicks = parseInt(insight.clicks || '0');
            report.cpm = parseFloat(insight.cpm || '0');
            report.ctr = parseFloat(insight.ctr || '0');
            report.reach = parseInt(insight.reach || '0');
            report.frequency = parseFloat(insight.frequency || '0');
            report.inline_link_clicks = parseInt(insight.inline_link_clicks || '0');
            report.inline_link_click_ctr = parseFloat(insight.inline_link_click_ctr || '0');
            report.cost_per_inline_link_click = parseFloat(insight.cost_per_inline_link_click || '0');
          } else {
            // No insights data available for this date (ad might not have run)
            console.warn(`No insights data for ad ${adData.ad_id} on ${userData.date}`);
          }

          reports.push(report);
          
        } catch (error) {
          const errorMsg = `Error processing ad ${adData.ad_id} for user ${userData.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    // Calculate summary
    const summary: AdPerformanceSummary = {
      totalUsers: new Set(reports.map(r => r.user_id)).size,
      totalAds: reports.length,
      totalSpend: reports.reduce((sum, r) => sum + r.spend, 0),
      totalImpressions: reports.reduce((sum, r) => sum + r.impressions, 0),
      totalClicks: reports.reduce((sum, r) => sum + r.clicks, 0),
      averageCPM: 0,
      averageCTR: 0,
      date: adDataArray[0]?.date || 'N/A'
    };

    // Calculate averages
    const validCPMs = reports.filter(r => r.cpm > 0);
    const validCTRs = reports.filter(r => r.ctr > 0);
    
    summary.averageCPM = validCPMs.length > 0 
      ? validCPMs.reduce((sum, r) => sum + r.cpm, 0) / validCPMs.length 
      : 0;
    
    summary.averageCTR = validCTRs.length > 0 
      ? validCTRs.reduce((sum, r) => sum + r.ctr, 0) / validCTRs.length 
      : 0;

    return {
      success: true,
      reports: reports,
      summary: summary,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${reports.length} ads for ${summary.totalUsers} users. ${errors.length} errors encountered.`
    };

  } catch (error) {
    return {
      success: false,
      message: `Error generating ad performance report: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
