import { AdAccount, Campaign } from 'facebook-nodejs-business-sdk';
import { getAdAccountForUser } from '../config.js';

// Get AdAccount for a specific user
const getAdAccount = (userId: string) => {
  const adAccount = getAdAccountForUser(userId);
  if (!adAccount) {
    throw new Error('User session not found or expired');
  }
  return adAccount;
};

// Create new campaign
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
    }
    
    const fieldsToRead = ['id', 'name', 'objective', 'status', 'created_time', 'daily_budget'];
    const result: Campaign = await adAccount.createCampaign(fieldsToRead, params);
    const campaignData = {
      id: result.id,
      name: result._data?.name,
      objective: result._data?.objective,
      status: result._data?.status,
      createdTime: result._data?.created_time,
      dailyBudget: result._data?.daily_budget ? result._data.daily_budget / 100 : null,
    };

    return {
      success: true,
      campaignId: campaignData.id,
      campaignData: campaignData,
      message: 'Campaign created successfully and data loaded.'
    };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return {
      success: false,
      message: `Error creating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get list of campaigns
export const getCampaigns = async (userId: string, limit = 10, status?: string) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const fields = ['id', 'name', 'objective', 'status', 'created_time', 'daily_budget'];
    const params: any = {
      limit
    };
    
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
        dailyBudget: campaign._data?.daily_budget ? campaign._data.daily_budget / 100 : null,
      }))
    };
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return {
      success: false,
      message: `Error getting campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
// Update campaign
export const updateCampaign = async (
  userId: string,
  campaignId: string,
  name?: string,
  status?: string,
  dailyBudget?: number,
  endTime?: string
) => {
  try {
    getAdAccount(userId); // Verify session
    const campaign = new Campaign(campaignId);
    
    const params: any = {};
    if (name) params.name = name;
    if (status) params.status = status;
    if (dailyBudget) params.daily_budget = dailyBudget * 100;
    if (endTime) params.end_time = endTime;
    
    await campaign.update(params);
    
    return {
      success: true,
      message: 'Campaign updated successfully'
    };
  } catch (error) {
    console.error('Error updating campaign:', error);
    return {
      success: false,
      message: `Error updating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get campaign details
export const getCampaignDetails = async (userId: string, campaignId: string) => {
  try {
    getAdAccount(userId); // Verify session
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
// Delete campaign
export const deleteCampaign = async (userId: string, campaignId: string) => {
  try {
    getAdAccount(userId); // Verify session
    const campaign = new Campaign(campaignId);
    
    await campaign.delete([]);
    
    return {
      success: true,
      message: 'Campaign deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return {
      success: false,
      message: `Error deleting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};