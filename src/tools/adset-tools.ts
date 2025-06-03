import { AdSet } from 'facebook-nodejs-business-sdk';
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