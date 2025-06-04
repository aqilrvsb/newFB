import { AdAccount, Campaign, AdSet } from 'facebook-nodejs-business-sdk';
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
    
    return {
      success: true,
      adSetId: result.id,
      adSetData: {
        id: result.id,
        name: result._data?.name,
        status: result._data?.status,
        optimizationGoal: result._data?.optimization_goal,
        billingEvent: result._data?.billing_event,
        dailyBudget: result._data?.daily_budget,
        lifetimeBudget: result._data?.lifetime_budget,
        startTime: result._data?.start_time,
        endTime: result._data?.end_time
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

// Duplicate Ad Set
export const duplicateAdSet = async (
  userId: string,
  adSetId: string,
  newName?: string
) => {
  try {
    const adAccount = getAdAccount(userId);
    const originalAdSet = new AdSet(adSetId);
    const adSetDetails = await originalAdSet.get([
      'name', 'campaign_id', 'targeting', 'optimization_goal', 
      'billing_event', 'bid_amount', 'daily_budget', 'lifetime_budget'
    ]);
    
    const params: any = {
      name: newName || `${adSetDetails._data?.name} - Copy`,
      campaign_id: adSetDetails._data?.campaign_id,
      targeting: adSetDetails._data?.targeting,
      optimization_goal: adSetDetails._data?.optimization_goal,
      billing_event: adSetDetails._data?.billing_event,
      status: 'PAUSED',
      special_ad_categories: []
    };
    
    if (adSetDetails._data?.bid_amount) params.bid_amount = adSetDetails._data.bid_amount;
    if (adSetDetails._data?.daily_budget) params.daily_budget = adSetDetails._data.daily_budget;
    if (adSetDetails._data?.lifetime_budget) params.lifetime_budget = adSetDetails._data.lifetime_budget;
    
    const fieldsToRead = ['id', 'name', 'status'];
    const result = await adAccount.createAdSet(fieldsToRead, params);
    
    return {
      success: true,
      adSetId: result.id,
      message: 'Ad set duplicated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error duplicating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Delete Ad Set
export const deleteAdSet = async (userId: string, adSetId: string) => {
  try {
    const adSet = new AdSet(adSetId);
    await adSet.delete([]);
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
    const params = { time_range: timeRange, level: 'adset' };
    const metrics = ['impressions', 'clicks', 'spend', 'cpc', 'ctr', 'reach'];
    const insights = await adSet.getInsights(metrics, params);
    
    if (!insights || insights.length === 0) {
      return {
        success: true,
        insights: null,
        message: 'No insights data available'
      };
    }
    
    const formattedInsights = insights.map((insight: any) => ({
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
