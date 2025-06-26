import { AdAccount, CustomAudience } from 'facebook-nodejs-business-sdk';
import { getAdAccountForUser } from '../config.js';

const getAdAccount = (userId: string) => {
  const adAccount = getAdAccountForUser(userId);
  if (!adAccount) {
    throw new Error('User session not found or expired');
  }
  return adAccount;
};

export const createCustomAudience = async (
  userId: string,
  name: string,
  description: string,
  customer_file_source: string,
  subtype: string
) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const params: any = {
      name,
      description,
      subtype
    };
    
    if (subtype === 'CUSTOM') {
      params.customer_file_source = customer_file_source || 'USER_PROVIDED_ONLY';
    } else {
      params.customer_file_source = 'USER_PROVIDED_ONLY'; // Always provide this required parameter
    }
    
    const fieldsToRead = ['id', 'name', 'description', 'subtype', 'approximate_count'];
    const result: CustomAudience = await adAccount.createCustomAudience(fieldsToRead, params);
    
    // Get the data from the SDK object
    const audienceData = await result.get(['id', 'name', 'description', 'subtype', 'approximate_count']);
    
    return {
      success: true,
      audienceId: audienceData.id,
      audienceData: {
        id: audienceData.id,
        name: audienceData.name,
        description: audienceData.description,
        subtype: audienceData.subtype,
        approximateCount: audienceData.approximate_count,
      },
      message: 'Custom audience created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating custom audience: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
export const getCustomAudiences = async (userId: string, limit = 10) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const fields = ['id', 'name', 'description', 'subtype', 'approximate_count'];
    const params = { limit };
    
    const audiences = await adAccount.getCustomAudiences(fields, params);
    
    return {
      success: true,
      audiences: audiences.map((audience: any) => ({
        id: audience.id,
        name: audience._data?.name,
        description: audience._data?.description,
        subtype: audience._data?.subtype,
        approximateCount: audience._data?.approximate_count,
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting custom audiences: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const createLookalikeAudience = async (
  userId: string,
  sourceAudienceId: string,
  name: string,
  description: string,
  country: string,
  ratio: number = 0.01
) => {
  try {
    const adAccount = getAdAccount(userId);
    
    const params = {
      name,
      description,
      subtype: 'LOOKALIKE',
      origin_audience_id: sourceAudienceId,
      lookalike_spec: {
        ratio,
        country
      }
    };
    
    const fieldsToRead = ['id', 'name', 'description', 'subtype', 'approximate_count'];
    const result: CustomAudience = await adAccount.createCustomAudience(fieldsToRead, params);
    
    // Get the data from the SDK object
    const audienceData = await result.get(['id', 'name', 'description', 'subtype', 'approximate_count']);
    
    return {
      success: true,
      audienceId: audienceData.id,
      audienceData: {
        id: audienceData.id,
        name: audienceData.name,
        description: audienceData.description,
        subtype: audienceData.subtype,
        approximateCount: audienceData.approximate_count,
      },
      message: 'Lookalike audience created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating lookalike audience: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};