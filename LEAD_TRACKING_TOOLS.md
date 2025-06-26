# Lead Tracking & ROI Tools Documentation

## Overview
The Lead Tracking tools integrate your Laravel application's lead data with Facebook Ads insights to provide comprehensive ROI (Return on Investment) metrics. This allows you to see exactly how much you're spending per lead and which ads are performing best.

## Tools Available

### 1. `get_leads_data`
Retrieves lead data from your Laravel application.

**Parameters:**
- `staffId` (string, required): Staff ID (e.g., "RV-007")
- `startDate` (string, required): Start date in DD-MM-YYYY format (e.g., "16-06-2025")
- `endDate` (string, required): End date in DD-MM-YYYY format (e.g., "17-06-2025")

**Returns:**
```json
{
  "success": true,
  "summary": {
    "totalLeads": 3,
    "dateRange": {
      "start": "16-06-2025",
      "end": "17-06-2025"
    },
    "staffId": "RV-007",
    "leadsByDateCount": [
      { "date": "2025-06-16", "count": 3 }
    ],
    "leadsByKeywordCount": [
      { "keyword": "KS1", "count": 3 }
    ],
    "leadsByAdIdCount": [
      { "adId": "120222861998810312", "count": 3 }
    ]
  },
  "leadsByDate": {
    "2025-06-16": [/* array of leads */]
  },
  "leadsByKeyword": {
    "KS1": [/* array of leads */]
  },
  "leadsByAdId": {
    "120222861998810312": [/* array of leads */]
  },
  "leads": [
    {
      "prospect_nama": "zulinahlinah",
      "prospect_num": "60179796785",
      "date_order": "2025-06-16",
      "keywordiklan": "KS1",
      "url": "https://www.facebook.com/61570446554637/posts/122118995966681551/",
      "ad_id": 120222861998810312
    }
    // ... more leads
  ]
}
```

### 2. `get_leads_with_insights`
Combines lead data with Facebook Ads insights for complete ROI analysis.

**Parameters:**
- `staffId` (string, required): Staff ID (e.g., "RV-007")
- `startDate` (string, required): Start date in DD-MM-YYYY format
- `endDate` (string, required): End date in DD-MM-YYYY format

**Returns:**
```json
{
  "success": true,
  "summary": {
    "dateRange": {
      "start": "16-06-2025",
      "end": "17-06-2025"
    },
    "totalLeads": 3,
    "totalSpend": 150.50,
    "overallCostPerLead": 50.17,
    "uniqueAdsUsed": 1,
    "bestPerformingAd": {
      "adId": "120222861998810312",
      "adName": "Summer Sale - Image Ad",
      "campaignName": "Summer 2025 Campaign",
      "totalLeads": 3,
      "totalSpend": 150.50,
      "costPerLead": 50.17,
      "impressions": 5432,
      "clicks": 87,
      "ctr": 1.6
    },
    "adWithMostLeads": {
      /* same as bestPerformingAd if only one ad */
    }
  },
  "adPerformance": {
    "120222861998810312": {
      "adId": "120222861998810312",
      "adName": "Summer Sale - Image Ad",
      "campaignName": "Summer 2025 Campaign",
      "totalLeads": 3,
      "totalSpend": 150.50,
      "costPerLead": 50.17,
      "impressions": 5432,
      "clicks": 87,
      "ctr": 1.6,
      "leads": [/* array of leads for this ad */]
    }
  },
  "leadsByDate": {/* grouped leads */},
  "leadsByKeyword": {/* grouped leads */},
  "rawLeads": [/* all leads */]
}
```

## Laravel App Requirements

Your Laravel application should expose an endpoint at:
```
https://rvsbbot.com/getinfo/{staffId}/{startDate}/{endDate}
```

The endpoint should return JSON data in this format:
```json
[
  {
    "prospect_nama": "Customer Name",
    "prospect_num": "Phone Number",
    "date_order": "YYYY-MM-DD",
    "keywordiklan": "Keyword/Campaign Code",
    "url": "Facebook Post URL",
    "ad_id": 120222861998810312
  }
]
```

## Use Cases

### 1. Daily Lead Report
```
Human: Get my leads report for today, staff ID RV-007

Claude: I'll fetch your leads report for today and analyze the ROI.

[Uses get_leads_with_insights with today's date]

Today's Lead Report for RV-007:
- Total Leads: 15
- Total Ad Spend: RM 450.00
- Cost Per Lead: RM 30.00

Best Performing Ad:
- "Summer Promo A" - 8 leads at RM 25/lead
- Campaign: "June 2025 Traffic"

Breakdown by Keyword:
- KS1: 8 leads
- KS2: 5 leads
- KS3: 2 leads
```

### 2. Compare Ad Performance
```
Human: Which ad generated the most leads this week?

Claude: [Uses get_leads_with_insights for the week]

This week's top performing ads by lead count:
1. Ad ID 120222861998810312 - "Summer Sale"
   - 45 leads
   - RM 1,350 spent
   - RM 30 per lead
   
2. Ad ID 120222861998810313 - "Flash Discount"
   - 32 leads
   - RM 1,120 spent
   - RM 35 per lead
```

### 3. ROI Analysis
```
Human: What's my ROI for the KS1 campaign?

Claude: [Uses get_leads_with_insights and filters by keyword]

KS1 Campaign ROI Analysis:
- Total Leads: 128
- Total Spend: RM 3,840
- Average Cost Per Lead: RM 30
- Date Range: Last 30 days

If your average customer value is RM 200:
- Potential Revenue: RM 25,600
- ROI: 567% (RM 21,760 profit)
```

### 4. Integration with check_ad_id
```
Human: I have ad ID 120222861998810312. Show me its performance with leads.

Claude: [First uses check_ad_id to get ad details, then get_leads_with_insights]

Ad Details:
- Name: Summer Sale - Image Ad
- Campaign: Summer 2025 Campaign
- Status: ACTIVE

Lead Performance (Last 7 days):
- Total Leads: 23
- Total Spend: RM 690
- Cost Per Lead: RM 30
- Click-Through Rate: 1.6%

Lead Quality:
- Most common keyword: KS1 (15 leads)
- Peak day: June 16 (8 leads)
```

## Benefits

1. **Complete ROI Visibility**: See exactly how much each ad costs per lead
2. **Performance Comparison**: Compare different ads, campaigns, and keywords
3. **Budget Optimization**: Identify which ads give the best value
4. **Lead Attribution**: Know exactly which Facebook ad generated each lead
5. **Historical Analysis**: Track performance over time

## Error Handling

The tools handle various error scenarios:
- Laravel app unavailable
- Invalid date formats
- No leads found for period
- Facebook API errors
- Missing ad permissions

## Best Practices

1. **Regular Monitoring**: Check lead performance daily
2. **Compare Periods**: Compare week-over-week or month-over-month
3. **Combine with Other Tools**: Use with campaign insights for full picture
4. **Set CPL Targets**: Define acceptable cost-per-lead thresholds
5. **Track by Staff**: Monitor performance by different staff IDs

## Technical Notes

- Lead data is fetched from your Laravel app in real-time
- Facebook insights are fetched for the same date range
- Ad IDs in leads are matched with Facebook ad data
- Calculations are done on-the-fly for accuracy
- Supports multiple ads, campaigns, and keywords
