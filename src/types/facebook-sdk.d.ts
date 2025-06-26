// Type declarations to fix build errors
declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): void;
    static getDefaultApi(): FacebookAdsApi;
    call(method: string, path: string[], params?: any, data?: any): Promise<any>;
  }
  
  export class User {
    constructor(id: string);
    id?: string;
    _data?: any;
    getAdAccounts(fields: string[], params?: any): Promise<any>;
    getAccounts(fields: string[], params?: any): Promise<any>;
  }
  
  export class AdAccount {
    constructor(id: string);
    id?: string;
    _data?: any;
    createCampaign(fields: string[], params: any): Promise<any>;
    getCampaigns(fields: string[], params?: any): Promise<any>;
    getAdSets(fields: string[], params?: any): Promise<any>;
    createAdSet(fields: string[], params: any): Promise<any>;
    getAds(fields: string[], params?: any): Promise<any>;
    createAd(fields: string[], params: any): Promise<any>;
    getCustomAudiences(fields: string[], params?: any): Promise<any>;
    createCustomAudience(fields: string[], params: any): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    createAdCreative(fields: string[], params: any): Promise<any>;
  }
  
  export class Campaign {
    constructor(id: string);
    id?: string;
    _data?: any;
    get(fields: string[]): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    update(params: any): Promise<any>;
    delete(): Promise<any>;
  }
  
  export class AdSet {
    constructor(id: string);
    id?: string;
    _data?: any;
    get(fields: string[]): Promise<any>;
    createAd(fields: string[], params: any): Promise<any>;
    getAds(fields: string[], params?: any): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    update(params: any): Promise<any>;
    delete(): Promise<any>;
  }
  
  export class Ad {
    constructor(id: string);
    id?: string;
    _data?: any;
    get(fields: string[]): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    update(params: any): Promise<any>;
    delete(): Promise<any>;
  }
  
  export class Page {
    constructor(id: string);
    id?: string;
    _data?: any;
    get(fields: string[]): Promise<any>;
    createFeed(fields: string[], params: any): Promise<any>;
    getFeed(fields: string[], params?: any): Promise<any>;
    getPosts(fields: string[], params?: any): Promise<any>;
    createPhoto(fields: string[], params: any): Promise<any>;
    getPhotos(fields: string[], params?: any): Promise<any>;
    createVideo(fields: string[], params: any): Promise<any>;
    getVideos(fields: string[], params?: any): Promise<any>;
    getInsights(fields: string[], params?: any): Promise<any>;
    getEvents(fields: string[], params?: any): Promise<any>;
    update(params: any): Promise<any>;
    delete(): Promise<any>;
  }
  
  export class CustomAudience {
    constructor(id: string);
    id?: string;
    _data?: any;
    get(fields: string[]): Promise<any>;
    update(params: any): Promise<any>;
    delete(): Promise<any>;
  }
  
  export class AdCreative {
    constructor(id: string);
    id?: string;
    _data?: any;
  }
  
  export class Business {
    constructor(id: string);
    id?: string;
    _data?: any;
  }
}
