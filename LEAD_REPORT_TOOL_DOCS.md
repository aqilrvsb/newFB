# Lead Report Tool Documentation

## Overview
The `get_lead_report` tool provides a comprehensive lead reporting solution that combines CRM lead data with Facebook Ads insights to generate detailed performance reports including ROAS (Return on Ad Spend) calculations.

## Tool Details

### Name: `get_lead_report`

### Description
Generate comprehensive lead report with full ad metrics including budget, spend, CPM, CTR, and ROAS

### Parameters
- **staffId** (string, required): Staff ID in format like RV-007, SM-001, etc.
- **startDate** (string, required): Start date in DD-MM-YYYY format
- **endDate** (string, required): End date in DD-MM-YYYY format

## Response Structure

### Success Response
```json
{
  "success": true,
  "dateRange": {
    "start": "01-06-2025",
    "end": "21-06-2025"
  },
  "staffId": "RV-007",
  "reports": [
    {
      "adId": "120219408501250312",
      "adName": "Summer Sale Campaign",
      "postUrl": "https://www.facebook.com/61570446554637/posts/122118995966681551/",
      "budgetAds": 100.00,
      "amountSpent": 45.67,
      "totalLead": 4,
      "costPerLead": 11.42,
      "cpm": 12.50,
      "ctr": 2.45,
      "ctrLinkClick": 1.87,
      "totalCustomer": 2,
      "totalPrice": 240.00,
      "roas": 5.25,
      "campaignName": "Summer 2025 Promotion",
      "adSetName": "Target Audience A"
    }
  ],
  "summary": {
    "totalLeads": 101,
    "totalCustomers": 9,
    "totalRevenue": 1080.00,
    "totalSpent": 245.67,
    "overallROAS": 4.40,
    "overallCostPerLead": 2.43,
    "totalSales": 9
  },
  "message": "Lead report generated successfully"
}
```

## Report Fields Explained

### Individual Report Fields
- **adId**: Facebook Ad ID (null for organic/direct traffic)
- **adName**: Name of the Facebook ad or "Organic/Direct Traffic"
- **postUrl**: URL of the Facebook post associated with the lead
- **budgetAds**: Daily or lifetime budget set for the ad set
- **amountSpent**: Actual amount spent on the ad during the date range
- **totalLead**: Number of leads generated from this ad
- **costPerLead**: Average cost per lead (amountSpent / totalLead)
- **cpm**: Cost per 1000 impressions
- **ctr**: Click-through rate (percentage)
- **ctrLinkClick**: Link click-through rate (percentage)
- **totalCustomer**: Number of leads that converted to customers
- **totalPrice**: Total revenue generated from this ad's customers
- **roas**: Return on Ad Spend (totalPrice / amountSpent)
- **campaignName**: Name of the parent campaign
- **adSetName**: Name of the parent ad set

### Summary Fields
- **totalLeads**: Sum of all leads across all channels
- **totalCustomers**: Sum of all customers across all channels
- **totalRevenue**: Total revenue from all customers
- **totalSpent**: Total ad spend across all ads
- **overallROAS**: Overall return on ad spend
- **overallCostPerLead**: Average cost per lead across all ads
- **totalSales**: Total number of sales transactions

## Usage Example

```javascript
// Using the MCP tool
const result = await callTool('get_lead_report', {
  staffId: 'RV-007',
  startDate: '01-06-2025',
  endDate: '21-06-2025'
});

// Process the results
if (result.success) {
  console.log(`Total ROAS: ${result.summary.overallROAS}`);
  
  // Find best performing ads
  const bestROAS = result.reports.reduce((best, current) => 
    current.roas > best.roas ? current : best
  );
  
  console.log(`Best performing ad: ${bestROAS.adName} with ROAS of ${bestROAS.roas}`);
}
```

## Key Features

1. **Comprehensive Metrics**: Combines CRM lead data with Facebook Ads insights
2. **ROAS Calculation**: Automatic calculation of Return on Ad Spend
3. **Multi-Channel Support**: Tracks both paid ads and organic traffic
4. **Budget vs Actual**: Shows both budget and actual spend
5. **Performance Indicators**: CPM, CTR, and conversion metrics
6. **Hierarchical Data**: Includes campaign and ad set information

## Best Practices

1. **Date Range**: Use reasonable date ranges (7-30 days) for accurate metrics
2. **Staff Selection**: Use specific staff IDs to track channel performance
3. **Regular Monitoring**: Run reports daily or weekly to track trends
4. **ROAS Targets**: Set ROAS targets based on your business margins
5. **Cost Per Lead**: Monitor CPL trends to optimize ad spending

## Integration with Other Tools

This tool works well with:
- `get_leads_data`: For raw lead data without ad insights
- `get_leads_with_insights`: For simpler lead + spend analysis
- `get_total_spend_all_accounts`: For overall spend tracking
- `get_campaign_insights`: For campaign-level performance

## Error Handling

Common errors:
- "Staff ID, start date, and end date are required" - Missing parameters
- "User session not found" - Need to authenticate first
- "Error fetching insights for ad" - Facebook API issues (logged but doesn't stop report)

## Notes

- Organic/direct traffic leads (no ad_id) are included with zero ad spend
- Facebook insights may have slight delays (up to 24 hours)
- Budget information comes from ad set level (daily or lifetime)
- All monetary values are in the account's currency
