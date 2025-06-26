import { Campaign } from 'facebook-nodejs-business-sdk';
import { getAdAccountForUser } from '../config.js';

const getAdAccount = (userId: string) => {
  const adAccount = getAdAccountForUser(userId);
  if (!adAccount) {
    throw new Error('User session not found or expired');
  }
  return adAccount;
};

export const getCampaignInsights = async (
  userId: string,
  campaignId: string,
  timeRange: { since: string; until: string },
  metrics: string[]
) => {
  try {
    getAdAccount(userId); // Verify session
    const campaign = new Campaign(campaignId);
    
    const params = {
      time_range: timeRange,
      fields: metrics
    };
    
    const insights = await campaign.getInsights(metrics, params);
    
    return {
      success: true,
      insights: insights.map((insight: any) => ({
        ...insight._data,
        date_start: insight._data?.date_start,
        date_stop: insight._data?.date_stop
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting campaign insights: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};