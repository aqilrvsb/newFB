// Facebook Ads Library Tools
// Search and retrieve ads from Facebook's Ad Library

import { getAdAccountForUser } from '../config.js';

// Get Meta Platform ID for a brand
export const getMetaPlatformId = async (
  userId: string,
  brandNames: string | string[]
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Ensure brandNames is an array
    const brands = Array.isArray(brandNames) ? brandNames : [brandNames];
    const results: any[] = [];

    for (const brandName of brands) {
      try {
        // Search for pages matching the brand name
        const response = await fetch(
          `https://graph.facebook.com/v23.0/pages/search?q=${encodeURIComponent(brandName)}&fields=id,name,category,verification_status,fan_count&access_token=${session.credentials.facebookAccessToken}`
        );

        const data: any = await response.json();
        
        if (data.error) {
          results.push({
            brandName,
            success: false,
            error: data.error.message
          });
          continue;
        }

        // Find the most relevant page (highest fan count or verified)
        const pages = data.data || [];
        const sortedPages = pages.sort((a: any, b: any) => {
          // Prioritize verified pages
          if (a.verification_status && !b.verification_status) return -1;
          if (!a.verification_status && b.verification_status) return 1;
          // Then sort by fan count
          return (b.fan_count || 0) - (a.fan_count || 0);
        });

        if (sortedPages.length > 0) {
          results.push({
            brandName,
            success: true,
            platformId: sortedPages[0].id,
            pageName: sortedPages[0].name,
            category: sortedPages[0].category,
            fanCount: sortedPages[0].fan_count,
            verified: sortedPages[0].verification_status || false,
            alternatives: sortedPages.slice(1, 5).map((p: any) => ({
              id: p.id,
              name: p.name,
              fanCount: p.fan_count
            }))
          });
        } else {
          results.push({
            brandName,
            success: false,
            error: 'No pages found for this brand name'
          });
        }
      } catch (error) {
        results.push({
          brandName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      results,
      totalSearched: brands.length,
      foundCount: results.filter(r => r.success).length,
      message: `Found platform IDs for ${results.filter(r => r.success).length} out of ${brands.length} brands`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting platform IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get ads from Meta Ads Library for a specific page
export const getMetaAds = async (
  userId: string,
  platformId: string,
  adType?: 'POLITICAL_AND_ISSUE_ADS' | 'ALL',
  adActiveStatus?: 'ALL' | 'ACTIVE' | 'INACTIVE',
  limit: number = 25,
  searchTerms?: string,
  adReachedCountries?: string[], // e.g., ['MY', 'US']
  adDeliveryDateMin?: string, // YYYY-MM-DD format
  adDeliveryDateMax?: string // YYYY-MM-DD format
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Build query parameters
    const params: any = {
      access_token: session.credentials.facebookAccessToken,
      ad_archive_id: platformId,
      ad_type: adType || 'ALL',
      ad_active_status: adActiveStatus || 'ALL',
      limit: Math.min(limit, 100), // Facebook's max is 100
      fields: 'id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,currency,funding_entity,impressions,page_id,page_name,publisher_platforms,spend,bylines,estimated_audience_size'
    };

    // Add optional filters
    if (searchTerms) params.search_terms = searchTerms;
    if (adReachedCountries && adReachedCountries.length > 0) {
      params.ad_reached_countries = adReachedCountries.join(',');
    }
    if (adDeliveryDateMin) params.ad_delivery_date_min = adDeliveryDateMin;
    if (adDeliveryDateMax) params.ad_delivery_date_max = adDeliveryDateMax;

    // Construct URL with query parameters
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const response = await fetch(
      `https://graph.facebook.com/v23.0/ads_archive?${queryString}`
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    // Process and format ads data
    const ads = (result.data || []).map((ad: any) => ({
      id: ad.id,
      pageId: ad.page_id,
      pageName: ad.page_name,
      creationTime: ad.ad_creation_time,
      deliveryStartTime: ad.ad_delivery_start_time,
      deliveryStopTime: ad.ad_delivery_stop_time,
      isActive: !ad.ad_delivery_stop_time || new Date(ad.ad_delivery_stop_time) > new Date(),
      creative: {
        bodies: ad.ad_creative_bodies || [],
        linkCaptions: ad.ad_creative_link_captions || [],
        linkDescriptions: ad.ad_creative_link_descriptions || [],
        linkTitles: ad.ad_creative_link_titles || []
      },
      snapshotUrl: ad.ad_snapshot_url,
      currency: ad.currency,
      fundingEntity: ad.funding_entity,
      impressions: ad.impressions ? {
        lowerBound: ad.impressions.lower_bound,
        upperBound: ad.impressions.upper_bound
      } : null,
      spend: ad.spend ? {
        lowerBound: ad.spend.lower_bound,
        upperBound: ad.spend.upper_bound,
        currency: ad.currency
      } : null,
      publisherPlatforms: ad.publisher_platforms || [],
      estimatedAudienceSize: ad.estimated_audience_size,
      bylines: ad.bylines || []
    }));

    return {
      success: true,
      platformId,
      ads,
      totalAds: ads.length,
      activeAds: ads.filter((ad: any) => ad.isActive).length,
      inactiveAds: ads.filter((ad: any) => !ad.isActive).length,
      paging: result.paging,
      message: `Retrieved ${ads.length} ads from the ads library`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting ads from library: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Search ads across multiple advertisers
export const searchAdsLibrary = async (
  userId: string,
  searchQuery: string,
  countries?: string[],
  adType?: 'POLITICAL_AND_ISSUE_ADS' | 'ALL',
  limit: number = 25
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const params: any = {
      access_token: session.credentials.facebookAccessToken,
      search_terms: searchQuery,
      ad_type: adType || 'ALL',
      limit: Math.min(limit, 100),
      fields: 'id,page_id,page_name,ad_creation_time,ad_creative_bodies,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,impressions,spend,publisher_platforms'
    };

    if (countries && countries.length > 0) {
      params.ad_reached_countries = countries.join(',');
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    const response = await fetch(
      `https://graph.facebook.com/v23.0/ads_archive?${queryString}`
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    // Group ads by advertiser
    const advertiserMap: { [key: string]: any[] } = {};
    
    (result.data || []).forEach((ad: any) => {
      if (!advertiserMap[ad.page_id]) {
        advertiserMap[ad.page_id] = [];
      }
      advertiserMap[ad.page_id].push({
        id: ad.id,
        creationTime: ad.ad_creation_time,
        isActive: !ad.ad_delivery_stop_time || new Date(ad.ad_delivery_stop_time) > new Date(),
        creativeBodies: ad.ad_creative_bodies || [],
        snapshotUrl: ad.ad_snapshot_url,
        impressions: ad.impressions,
        spend: ad.spend,
        platforms: ad.publisher_platforms || []
      });
    });

    const advertisers = Object.entries(advertiserMap).map(([pageId, ads]) => ({
      pageId,
      pageName: ads[0]?.page_name || 'Unknown',
      adCount: ads.length,
      activeAdCount: ads.filter(ad => ad.isActive).length,
      ads: ads.slice(0, 5) // Top 5 ads per advertiser
    }));

    return {
      success: true,
      searchQuery,
      totalAds: result.data?.length || 0,
      uniqueAdvertisers: advertisers.length,
      advertisers,
      countries: countries || [],
      message: `Found ${result.data?.length || 0} ads from ${advertisers.length} advertisers`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error searching ads library: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get competitor analysis
export const getCompetitorAdsAnalysis = async (
  userId: string,
  competitorPageIds: string[],
  dateRange: number = 30 // days
) => {
  try {
    const results: any[] = [];
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const pageId of competitorPageIds) {
      const adsResult = await getMetaAds(
        userId,
        pageId,
        'ALL',
        'ALL',
        100,
        undefined,
        undefined,
        startDate,
        endDate
      );

      if (adsResult.success) {
        const activeAds = adsResult.ads.filter((ad: any) => ad.isActive);
        const totalSpend = adsResult.ads.reduce((sum: number, ad: any) => {
          if (ad.spend) {
            return sum + ((ad.spend.lowerBound + ad.spend.upperBound) / 2);
          }
          return sum;
        }, 0);

        results.push({
          pageId,
          pageName: adsResult.ads[0]?.pageName || 'Unknown',
          success: true,
          metrics: {
            totalAds: adsResult.totalAds,
            activeAds: activeAds.length,
            inactiveAds: adsResult.totalAds - activeAds.length,
            estimatedSpend: totalSpend,
            currency: adsResult.ads[0]?.currency || 'USD',
            platforms: [...new Set(adsResult.ads.flatMap((ad: any) => ad.publisherPlatforms))],
            creativesUsed: adsResult.ads.length,
            dateRange: { start: startDate, end: endDate }
          },
          topAds: adsResult.ads.slice(0, 3)
        });
      } else {
        results.push({
          pageId,
          success: false,
          error: adsResult.message
        });
      }
    }

    return {
      success: true,
      competitors: results,
      summary: {
        totalCompetitors: competitorPageIds.length,
        successfulAnalysis: results.filter(r => r.success).length,
        totalAdsAcrossCompetitors: results.reduce((sum, r) => sum + (r.metrics?.totalAds || 0), 0),
        totalActiveAds: results.reduce((sum, r) => sum + (r.metrics?.activeAds || 0), 0)
      },
      message: `Analyzed ${results.filter(r => r.success).length} out of ${competitorPageIds.length} competitors`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error analyzing competitors: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
