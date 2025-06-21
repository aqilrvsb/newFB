import { userSessionManager } from '../config.js';
import { getLeadsData } from './lead-tracking-tools.js';
import { getAccountInsights } from './account-insights-tools.js';
import { checkAdId } from './ad-tools.js';

const { FacebookAdsApi, Ad, AdSet } = require('facebook-nodejs-business-sdk');

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
  staffId: string,
  startDate: string,  // DD-MM-YYYY format
  endDate: string     // DD-MM-YYYY format
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Initialize SDK
    FacebookAdsApi.init(session.credentials.facebookAccessToken);

    // Step 1: Get leads data
    const leadsResult = await getLeadsData(userId, staffId, startDate, endDate);
    
    if (!leadsResult.success || !leadsResult.rawData) {
      return {
        success: false,
        message: 'Failed to get leads data'
      };
    }

    const leadsData = leadsResult.rawData.leads as LeadData[];
    const leadReports: LeadReport[] = [];

    // Convert date format for Facebook API (DD-MM-YYYY to YYYY-MM-DD)
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    const fbStartDate = `${startParts[2]}-${startParts[1]}-${startParts[0]}`;
    const fbEndDate = `${endParts[2]}-${endParts[1]}-${endParts[0]}`;

    // Step 2: Process each lead entry
    for (const lead of leadsData) {
      let report: LeadReport = {
        adId: lead.ad_id,
        adName: lead.ad_id ? 'Loading...' : 'Organic/Direct Traffic',
        postUrl: lead.url,
        budgetAds: 0,
        amountSpent: 0,
        totalLead: lead.total_lead || 0,
        costPerLead: 0,
        cpm: 0,
        ctr: 0,
        ctrLinkClick: 0,
        totalCustomer: lead.total_customer || 0,
        totalPrice: lead.total_price || 0,
        roas: 0
      };

      // If there's an ad_id, get Facebook insights
      if (lead.ad_id) {
        try {
          // Get ad details and hierarchy
          const ad = new Ad(lead.ad_id);
          
          // Get ad name and hierarchy
          const adDetails = await ad.get(['name', 'adset{id,name,daily_budget,lifetime_budget}', 'campaign{id,name}']);
          
          report.adName = adDetails.name || `Ad ${lead.ad_id}`;
          report.campaignName = adDetails.campaign?.name;
          report.adSetName = adDetails.adset?.name;
          
          // Get budget from ad set
          if (adDetails.adset) {
            const dailyBudget = adDetails.adset.daily_budget ? parseFloat(adDetails.adset.daily_budget) / 100 : 0;
            const lifetimeBudget = adDetails.adset.lifetime_budget ? parseFloat(adDetails.adset.lifetime_budget) / 100 : 0;
            report.budgetAds = lifetimeBudget || dailyBudget;
          }

          // Get ad insights for the date range
          const insightsParams = {
            time_range: {
              since: fbStartDate,
              until: fbEndDate
            }
          };
          
          const insights = await ad.getInsights(
            ['spend', 'impressions', 'clicks', 'cpm', 'ctr', 'inline_link_clicks', 'inline_link_click_ctr'],
            insightsParams
          );

          if (insights && insights.length > 0) {
            const insight = insights[0];
            
            report.amountSpent = parseFloat(insight.spend || '0');
            report.cpm = parseFloat(insight.cpm || '0');
            report.ctr = parseFloat(insight.ctr || '0');
            report.ctrLinkClick = parseFloat(insight.inline_link_click_ctr || '0');
            
            // Calculate cost per lead
            if (report.totalLead > 0) {
              report.costPerLead = report.amountSpent / report.totalLead;
            }
            
            // Calculate ROAS (Return on Ad Spend)
            if (report.amountSpent > 0) {
              report.roas = report.totalPrice / report.amountSpent;
            }
          }
        } catch (error) {
          console.error(`Error getting insights for ad ${lead.ad_id}:`, error);
          // Keep the basic data even if we can't get insights
          report.adName = `Ad ${lead.ad_id} (Error loading details)`;
        }
      } else {
        // For organic/direct traffic, calculate overall metrics if needed
        report.adName = 'Organic/Direct Traffic';
      }

      leadReports.push(report);
    }

    // Calculate summary metrics
    const summary = {
      totalLeads: leadReports.reduce((sum, r) => sum + r.totalLead, 0),
      totalCustomers: leadReports.reduce((sum, r) => sum + r.totalCustomer, 0),
      totalRevenue: leadReports.reduce((sum, r) => sum + r.totalPrice, 0),
      totalSpent: leadReports.reduce((sum, r) => sum + r.amountSpent, 0),
      overallROAS: 0,
      overallCostPerLead: 0,
      totalSales: leadsResult.rawData.total_sale || 0
    };

    if (summary.totalSpent > 0) {
      summary.overallROAS = summary.totalRevenue / summary.totalSpent;
    }
    
    if (summary.totalLeads > 0) {
      summary.overallCostPerLead = summary.totalSpent / summary.totalLeads;
    }

    return {
      success: true,
      dateRange: {
        start: startDate,
        end: endDate
      },
      staffId: staffId,
      reports: leadReports,
      summary: summary,
      message: 'Lead report generated successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Error generating lead report: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
