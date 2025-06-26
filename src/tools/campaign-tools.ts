import { AdAccount, Campaign } from 'facebook-nodejs-business-sdk';
import { getAdAccountForUser } from '../config.js';

const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');

const getAdAccount = (userId: string) => {
  const adAccount = getAdAccountForUser(userId);
  if (!adAccount) {
    throw new Error('User session not found or expired');
  }
  return adAccount;
};

export const createCampaign = async (
  userId: string,
  name: string,
  objective: string,
  status: string,
  dailyBudget?: number,
  startTime?: string,
  endTime?: string,
  special_ad_categories?: string[]
) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const params: any = {
      name,
      objective,
      status
    };
    
    if (dailyBudget) {
      params.daily_budget = dailyBudget * 100;
    }
    
    if (startTime) {
      params.start_time = startTime;
    }
    
    if (endTime) {
      params.end_time = endTime;
    }
    
    if (special_ad_categories && special_ad_categories.length > 0) {
      params.special_ad_categories = special_ad_categories;
    } else {
      params.special_ad_categories = [];
    }
    
    const fieldsToRead = ['id', 'name', 'objective', 'status', 'created_time', 'daily_budget'];
    const result: Campaign = await adAccount.createCampaign(fieldsToRead, params);
    
    // Get the data from the SDK object
    const resultData = await result.get(['id', 'name', 'objective', 'status', 'created_time', 'daily_budget']);
    
    const campaignData = {
      id: resultData.id,
      name: resultData.name,
      objective: resultData.objective,
      status: resultData.status,
      createdTime: resultData.created_time,
      dailyBudget: resultData.daily_budget ? resultData.daily_budget / 100 : null
    };

    return {
      success: true,
      campaignId: campaignData.id,
      campaignData: campaignData,
      message: 'Campaign created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const getCampaigns = async (userId: string, limit = 10, status?: string) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const fields = ['id', 'name', 'objective', 'status', 'created_time', 'daily_budget'];
    const params: any = { limit };
    
    if (status) {
      params.filtering = [
        {
          field: 'status',
          operator: 'EQUAL',
          value: status
        }
      ];
    }
    
    const campaigns = await adAccount.getCampaigns(fields, params);
    
    return {
      success: true,
      campaigns: campaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign._data?.name,
        objective: campaign._data?.objective,
        status: campaign._data?.status,
        createdTime: campaign._data?.created_time,
        dailyBudget: campaign._data?.daily_budget ? campaign._data.daily_budget / 100 : null
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const updateCampaign = async (
  userId: string,
  campaignId: string,
  name?: string,
  status?: string,
  dailyBudget?: number,
  endTime?: string
) => {
  try {
    const campaign = new Campaign(campaignId);
    
    const params: any = {};
    
    if (name) params.name = name;
    if (status) params.status = status;
    if (dailyBudget) params.daily_budget = dailyBudget * 100;
    if (endTime) params.end_time = endTime;
    
    const result = await campaign.update(params);
    
    return {
      success: true,
      message: 'Campaign updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error updating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const getCampaignDetails = async (userId: string, campaignId: string) => {
  try {
    const campaign = new Campaign(campaignId);
    
    const fields = [
      'id', 'name', 'objective', 'status', 'created_time', 
      'start_time', 'stop_time', 'daily_budget', 'lifetime_budget',
      'spend_cap', 'budget_remaining', 'buying_type', 'special_ad_categories'
    ];
    
    const campaignDetails = await campaign.get(fields);
    
    return {
      success: true,
      campaign: {
        id: campaignDetails.id,
        name: campaignDetails._data?.name,
        objective: campaignDetails._data?.objective,
        status: campaignDetails._data?.status,
        createdTime: campaignDetails._data?.created_time,
        startTime: campaignDetails._data?.start_time,
        stopTime: campaignDetails._data?.stop_time,
        dailyBudget: campaignDetails._data?.daily_budget ? campaignDetails._data.daily_budget / 100 : null,
        lifetimeBudget: campaignDetails._data?.lifetime_budget ? campaignDetails._data.lifetime_budget / 100 : null,
        spendCap: campaignDetails._data?.spend_cap ? campaignDetails._data.spend_cap / 100 : null,
        budgetRemaining: campaignDetails._data?.budget_remaining ? campaignDetails._data.budget_remaining / 100 : null,
        buyingType: campaignDetails._data?.buying_type,
        specialAdCategories: campaignDetails._data?.special_ad_categories
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting campaign details: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const duplicateCampaign = async (
  userId: string,
  campaignId: string,
  newName?: string
) => {
  try {
    const adAccount = getAdAccount(userId);
    const originalCampaign = new Campaign(campaignId);
    const campaignDetails = await originalCampaign.get([
      'name', 'objective', 'status', 'daily_budget', 'lifetime_budget', 
      'buying_type', 'special_ad_categories'
    ]);
    
    const params: any = {
      name: newName || `${campaignDetails._data?.name} - Copy`,
      objective: campaignDetails._data?.objective,
      status: 'PAUSED',
      special_ad_categories: campaignDetails._data?.special_ad_categories || []
    };
    
    if (campaignDetails._data?.daily_budget) {
      params.daily_budget = campaignDetails._data.daily_budget;
    }
    if (campaignDetails._data?.lifetime_budget) {
      params.lifetime_budget = campaignDetails._data.lifetime_budget;
    }
    if (campaignDetails._data?.buying_type) {
      params.buying_type = campaignDetails._data.buying_type;
    }
    
    const fieldsToRead = ['id', 'name', 'objective', 'status', 'created_time'];
    const result = await adAccount.createCampaign(fieldsToRead, params);
    
    return {
      success: true,
      campaignId: result.id,
      campaignData: {
        id: result.id,
        name: result._data?.name,
        objective: result._data?.objective,
        status: result._data?.status,
        createdTime: result._data?.created_time
      },
      message: 'Campaign duplicated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error duplicating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const deleteCampaign = async (userId: string, campaignId: string) => {
  try {
    const campaignToDelete = new Campaign(campaignId);
    const result = await campaignToDelete.delete();
    return {
      success: true,
      message: 'Campaign deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
