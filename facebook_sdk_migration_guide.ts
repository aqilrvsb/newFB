/**
 * Facebook SDK Migration Helper
 * Use these patterns to replace fetch calls with SDK methods
 */

// Helper function to make Facebook API calls using SDK
export async function facebookApiCall(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  accessToken?: string
): Promise<any> {
  const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
  
  // Initialize API with token if provided
  if (accessToken) {
    FacebookAdsApi.init(accessToken);
  }
  
  const api = FacebookAdsApi.getDefaultApi();
  
  // Remove version prefix from endpoint
  endpoint = endpoint.replace(/^\/v\d+\.\d+\//, '');
  
  try {
    const result = await api.call(method, [endpoint], {}, data);
    return result;
  } catch (error: any) {
    if (error.response?.error) {
      throw new Error(error.response.error.message);
    }
    throw error;
  }
}

// Specific SDK methods for common operations
export const FacebookSDKHelpers = {
  // Page operations
  async createPagePost(pageId: string, data: any) {
    const { Page } = require('facebook-nodejs-business-sdk');
    const page = new Page(pageId);
    return await page.createFeed([], data);
  },
  
  async getPagePosts(pageId: string, fields: string[], params: any = {}) {
    const { Page } = require('facebook-nodejs-business-sdk');
    const page = new Page(pageId);
    return await page.getPosts(fields, params);
  },
  
  // Campaign operations
  async createCampaign(accountId: string, data: any) {
    const { AdAccount } = require('facebook-nodejs-business-sdk');
    const account = new AdAccount(accountId);
    return await account.createCampaign([], data);
  },
  
  async getCampaignInsights(campaignId: string, fields: string[], params: any = {}) {
    const { Campaign } = require('facebook-nodejs-business-sdk');
    const campaign = new Campaign(campaignId);
    return await campaign.getInsights(fields, params);
  },
  
  // Ad operations
  async createAd(adSetId: string, data: any) {
    const { AdSet } = require('facebook-nodejs-business-sdk');
    const adset = new AdSet(adSetId);
    return await adset.createAd([], data);
  },
  
  // Generic operations
  async getObject(objectId: string, fields: string[]) {
    const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
    return await api.call('GET', [objectId], { fields: fields.join(',') });
  },
  
  async deleteObject(objectId: string) {
    const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
    return await api.call('DELETE', [objectId], {});
  }
};