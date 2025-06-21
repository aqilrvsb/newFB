import { Ad } from 'facebook-nodejs-business-sdk';
import { getAdAccountForUser } from '../config.js';

const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');

const getAdAccount = (userId: string) => {
  const adAccount = getAdAccountForUser(userId);
  if (!adAccount) {
    throw new Error('User session not found or expired');
  }
  return adAccount;
};

export const createAd = async (
  userId: string,
  adSetId: string,
  name: string,
  creativeId: string,
  status: string = 'PAUSED'
) => {
  try {
    const adAccount = getAdAccount(userId);
    
    // Debug log
    console.log('Creating ad with params:', {
      name,
      adSetId,
      creativeId,
      status
    });
    
    const params: any = {
      name,
      adset_id: adSetId,
      creative: { creative_id: creativeId },
      status,
      special_ad_categories: []
    };
    
    const fieldsToRead = ['id', 'name', 'status'];
    const result: Ad = await adAccount.createAd(fieldsToRead, params);
    
    // Get the data from the SDK object
    const adData = await result.get(['id', 'name', 'status']);
    
    return {
      success: true,
      adId: adData.id,
      adData: {
        id: adData.id,
        name: adData.name,
        status: adData.status
      },
      message: 'Ad created successfully (Note: Update creative with real page ID and content)'
    };
  } catch (error) {
    console.error('Ad creation error:', error);
    return {
      success: false,
      message: `Error creating ad: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const updateAd = async (
  userId: string,
  adId: string,
  name?: string,
  status?: string,
  creative?: any
) => {
  try {
    const ad = new Ad(adId);
    const params: any = {};
    if (name) params.name = name;
    if (status) params.status = status;
    if (creative) params.creative = creative;
    
    const result = await ad.update(params);
    return {
      success: true,
      message: 'Ad updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error updating ad: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const duplicateAd = async (
  userId: string,
  adId: string,
  newName?: string
) => {
  try {
    const adAccount = getAdAccount(userId);
    const originalAd = new Ad(adId);
    const adDetails = await originalAd.get(['name', 'adset', 'creative', 'status']);
    
    const params = {
      name: newName || `${adDetails._data?.name} - Copy`,
      adset_id: adDetails._data?.adset?.id,
      creative: adDetails._data?.creative,
      status: 'PAUSED',
      special_ad_categories: []
    };
    
    const fieldsToRead = ['id', 'name', 'status'];
    const result = await adAccount.createAd(fieldsToRead, params);
    
    return {
      success: true,
      adId: result.id,
      adData: {
        id: result.id,
        name: result._data?.name,
        status: result._data?.status
      },
      message: 'Ad duplicated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error duplicating ad: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const deleteAd = async (userId: string, adId: string) => {
  try {
    const adToDelete = new Ad(adId);
    const result = await adToDelete.delete();
    return {
      success: true,
      message: 'Ad deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting ad: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const getAdInsights = async (
  userId: string,
  adId: string,
  dateRange: string = 'last_7_days'
) => {
  try {
    const ad = new Ad(adId);
    const timeRange = getTimeRangeFromString(dateRange);
    const params = { time_range: timeRange, level: 'ad' };
    const metrics = ['impressions', 'clicks', 'spend', 'cpc', 'ctr', 'reach'];
    const insights = await ad.getInsights(metrics, params);
    
    if (!insights || insights.length === 0) {
      return {
        success: true,
        insights: null,
        message: 'No insights data available for the specified date range'
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
      message: 'Ad insights retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting ad insights: ${error instanceof Error ? error.message : 'Unknown error'}`
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

// New tool: Check ad details by ad ID
export const checkAdId = async (userId: string, adId: string) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Initialize API with user token
    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    
    // Get ad details using SDK - start with basic fields
    const ad = new Ad(adId);
    const adData = await ad.get([
      'id', 'name', 'status', 'effective_status', 'created_time', 'account_id', 'adset'
    ]);
    
    if (adData.error) {
      return { 
        success: false, 
        message: adData.error.message,
        errorCode: adData.error.code
      };
    }

    // Build result step by step
    const result: any = {
      success: true,
      adInfo: {
        adId: adData.id,
        adName: adData.name,
        adStatus: adData.status,
        adEffectiveStatus: adData.effective_status,
        adCreatedTime: adData.created_time,
        adAccountId: adData.account_id
      },
      hierarchy: {
        level4_adAccount: adData.account_id,
        level1_ad: adData.id
      },
      message: 'Ad details retrieved successfully'
    };

    // Get ad set information if available
    if (adData.adset) {
      try {
        const { AdSet } = require('facebook-nodejs-business-sdk');
        const adSet = new AdSet(adData.adset.id);
        const adSetData = await adSet.get(['id', 'name', 'status', 'campaign_id']);
        
        if (adSetData && !adSetData.error) {
          result.adSetInfo = {
            adSetId: adSetData.id,
            adSetName: adSetData.name,
            adSetStatus: adSetData.status
          };
          result.hierarchy.level2_adSet = adSetData.id;
          
          // Get campaign information if available
          if (adSetData.campaign_id) {
            try {
              const { Campaign } = require('facebook-nodejs-business-sdk');
              const campaign = new Campaign(adSetData.campaign_id);
              const campaignData = await campaign.get(['id', 'name', 'objective', 'status']);
              
              if (campaignData && !campaignData.error) {
                result.campaignInfo = {
                  campaignId: campaignData.id,
                  campaignName: campaignData.name,
                  campaignObjective: campaignData.objective,
                  campaignStatus: campaignData.status
                };
                result.hierarchy.level3_campaign = campaignData.id;
              }
            } catch (campaignError) {
              // Campaign fetch failed, but continue with what we have
              result.hierarchy.level3_campaign = 'Unable to fetch';
            }
          }
        }
      } catch (adSetError) {
        // AdSet fetch failed, but continue with what we have  
        result.hierarchy.level2_adSet = 'Unable to fetch';
      }
    }

    // Try to get ad account info
    if (adData.account_id) {
      try {
        const { AdAccount } = require('facebook-nodejs-business-sdk');
        const account = new AdAccount(adData.account_id);
        const accountData = await account.get(['name', 'currency', 'timezone_name']);
        
        if (accountData && !accountData.error) {
          result.adAccountInfo = {
            accountId: adData.account_id,
            accountName: accountData.name,
            currency: accountData.currency,
            timezone: accountData.timezone_name
          };
        }
      } catch (accountError) {
        // Account fetch failed, but we still have the ID
        result.adAccountInfo = {
          accountId: adData.account_id,
          accountName: 'Unable to fetch',
          currency: 'Unknown',
          timezone: 'Unknown'
        };
      }
    }

    return result;

  } catch (error) {
    return {
      success: false,
      message: `Error checking ad ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
