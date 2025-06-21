import { FacebookAdsApi, AdSet, AdAccount, Campaign } from 'facebook-nodejs-business-sdk';
import { getAdAccountForUser } from '../config.js';

const getAdAccount = (userId: string) => {
  const adAccount = getAdAccountForUser(userId);
  if (!adAccount) {
    throw new Error('User session not found or expired');
  }
  return adAccount;
};

export const createAdSet = async (
  userId: string,
  campaignId: string,
  name: string,
  status: string,
  targeting: any,
  optimizationGoal: string,
  billingEvent: string,
  bidAmount?: number,
  dailyBudget?: number,
  lifetimeBudget?: number,
  startTime?: string,
  endTime?: string
) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const params: any = {
      name,
      campaign_id: campaignId,
      status,
      targeting,
      optimization_goal: optimizationGoal,
      billing_event: billingEvent
    };
    
    if (bidAmount) params.bid_amount = bidAmount;
    if (dailyBudget) params.daily_budget = dailyBudget;
    if (lifetimeBudget) params.lifetime_budget = lifetimeBudget;
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;
    
    const fieldsToRead = ['id', 'name', 'status', 'optimization_goal', 'billing_event', 'daily_budget', 'lifetime_budget'];
    const result: AdSet = await adAccount.createAdSet(fieldsToRead, params);
    
    // Get the data from the SDK object
    const adSetData = await result.get(['id', 'name', 'status', 'optimization_goal', 'billing_event', 'daily_budget', 'lifetime_budget', 'start_time', 'end_time']);
    
    return {
      success: true,
      adSetId: adSetData.id,
      adSetData: {
        id: adSetData.id,
        name: adSetData.name,
        status: adSetData.status,
        optimizationGoal: adSetData.optimization_goal,
        billingEvent: adSetData.billing_event,
        dailyBudget: adSetData.daily_budget,
        lifetimeBudget: adSetData.lifetime_budget,
        startTime: adSetData.start_time,
        endTime: adSetData.end_time
      },
      message: 'Ad set created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
// Update Ad Set
export const updateAdSet = async (
  userId: string,
  adSetId: string,
  name?: string,
  status?: string,
  dailyBudget?: number
) => {
  try {
    const adSet = new AdSet(adSetId);
    const params: any = {};
    
    if (name) params.name = name;
    if (status) params.status = status;
    if (dailyBudget) params.daily_budget = dailyBudget * 100;
    
    await adSet.update(params);
    return {
      success: true,
      message: 'Ad set updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error updating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Duplicate Ad Set using Facebook's /copies endpoint
export const duplicateAdSet = async (
  userId: string,
  adSetId: string,
  newName?: string
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    
    if (!session) {
      throw new Error('User session not found or expired');
    }
    
    const accessToken = session.credentials.facebookAccessToken;
    
    // Get original ad set details using SDK
    const originalAdSet = new AdSet(adSetId);
    const originalAdSetData = await originalAdSet.get(['name', 'targeting']);
    
    // Use Facebook SDK for duplication
    const copyParams: any = {
      name: newName || `${originalAdSetData.name} - Copy`,
      deep_copy: false,
      status_option: 'PAUSED'
    };
    
    // Add targeting with advantage_audience fix if original has targeting
    if (originalAdSetData.targeting) {
      const modifiedTargeting = {
        ...originalAdSetData.targeting,
        targeting_automation: {
          advantage_audience: 0  // Explicitly set to 0 (disabled)
        }
      };
      copyParams.targeting = modifiedTargeting;
    } else {
      // Create minimal targeting with advantage_audience
      const defaultTargeting = {
        geo_locations: {
          countries: ['MY']
        },
        age_min: 18,
        age_max: 65,
        targeting_automation: {
          advantage_audience: 0
        }
      };
      copyParams.targeting = defaultTargeting;
    }

    // Use the Ad Set's create copy method (Note: This might need to be done via parent AdAccount)
    const adAccount = getAdAccount(userId);
    const response = await adAccount.createAdSet(['id'], {
      ...copyParams,
      campaign_id: originalAdSetData.campaign_id
    });
    
    return {
      success: true,
      adSetId: response.id,
      originalAdSetId: adSetId,
      newAdSetName: newName || `${originalAdSetData.name} - Copy`,
      message: "Ad Set duplicated successfully using Facebook /copies endpoint"
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error duplicating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error.message || 'Unknown error',
      details: error.response?.body || error
    };
  }
};

// Delete Ad Set
export const deleteAdSet = async (userId: string, adSetId: string) => {
  try {
    const adSet = new AdSet(adSetId);
    const result = await adSet.delete();
    return {
      success: true,
      message: 'Ad set deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting ad set: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get Ad Set Insights
export const getAdSetInsights = async (
  userId: string,
  adSetId: string,
  dateRange: string = 'last_7_days'
) => {
  try {
    const adSet = new AdSet(adSetId);
    const timeRange = getTimeRangeFromString(dateRange);
    const params = { 
      time_range: timeRange,
      level: 'adset'
    };
    const insights = await adSet.getInsights(
      ['impressions', 'clicks', 'spend', 'cpc', 'ctr', 'reach'],
      params
    );
    const insightsData = Array.isArray(insights) ? insights : (insights.data || []);
    
    if (!insightsData || insightsData.length === 0) {
      return {
        success: true,
        insights: null,
        message: 'No insights data available'
      };
    }
    
    const formattedInsights = insightsData.map((insight: any) => ({
      date_start: insight.date_start,
      date_stop: insight.date_stop,
      impressions: parseInt(insight.impressions || '0'),
      clicks: parseInt(insight.clicks || '0'),
      spend: parseFloat(insight.spend || '0'),
      cpc: parseFloat(insight.cpc || '0'),
      ctr: parseFloat(insight.ctr || '0'),
      reach: parseInt(insight.reach || '0')
    }));
    
    return {
      success: true,
      insights: formattedInsights,
      message: 'Ad set insights retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting ad set insights: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

function getTimeRangeFromString(dateRange: string) {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;
  
  switch (dateRange) {
    case 'today': startDate = endDate; break;
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      startDate = yesterday.toISOString().split('T')[0];
      break;
    case 'last_30_days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      break;
    default:
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      startDate = sevenDaysAgo.toISOString().split('T')[0];
  }
  
  return { since: startDate, until: endDate };
}
