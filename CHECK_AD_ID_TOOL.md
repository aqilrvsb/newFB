# Check Ad ID Tool Documentation

## Overview
The `check_ad_id` tool is a powerful new addition to the Facebook Ads MCP Server that allows you to retrieve complete ad hierarchy information using just a Facebook ad ID.

## Purpose
When you have an ad ID (e.g., from a report, error log, or user query), this tool helps you understand:
- Which ad set contains this ad
- Which campaign contains the ad set
- Which ad account owns everything
- Full details about each level of the hierarchy

## Tool Details

**Tool Name:** `check_ad_id`
**Required Permission:** User Access Token
**Added:** June 18, 2025

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| adId | string | Yes | The Facebook ad ID to check (e.g., "120222861998810312") |

## Output Structure

The tool returns a comprehensive object with the following structure:

```json
{
  "success": true,
  "adInfo": {
    "adId": "120222861998810312",
    "adName": "Summer Sale - Image Ad",
    "adStatus": "ACTIVE",
    "adEffectiveStatus": "ACTIVE",
    "adCreatedTime": "2025-06-15T10:30:00+0000",
    "adAccountId": "act_123456789"
  },
  "adSetInfo": {
    "adSetId": "23851234567890",
    "adSetName": "Target Audience 18-35",
    "adSetStatus": "ACTIVE"
  },
  "campaignInfo": {
    "campaignId": "23850987654321",
    "campaignName": "Summer 2025 Campaign",
    "campaignObjective": "OUTCOME_TRAFFIC",
    "campaignStatus": "ACTIVE"
  },
  "adAccountInfo": {
    "accountId": "act_123456789",
    "accountName": "My Business Account",
    "currency": "USD",
    "timezone": "America/New_York"
  },
  "hierarchy": {
    "level4_adAccount": "act_123456789",
    "level3_campaign": "23850987654321",
    "level2_adSet": "23851234567890",
    "level1_ad": "120222861998810312"
  },
  "message": "Ad details retrieved successfully"
}
```

## Use Cases

### 1. Debugging Ad Issues
When an ad has problems, use this tool to quickly understand its context:
```
User: "Check ad ID 120222861998810312"
Claude: [Uses check_ad_id tool to get full hierarchy and status information]
```

### 2. Audit Trail
Track where specific ads belong in your account structure:
- Verify which campaign an ad belongs to
- Check if the ad is in the correct ad set
- Confirm account ownership

### 3. Quick Status Check
Get immediate visibility into:
- Ad status (ACTIVE, PAUSED, etc.)
- Effective status (actual delivery status)
- Creation time
- Parent entities' statuses

### 4. Cross-Reference Validation
When you have an ad ID from:
- Facebook Ads Manager exports
- API error messages
- Performance reports
- Customer complaints

## Example Usage in Claude

```
Human: Can you check what campaign this ad belongs to? ID: 120222861998810312

Claude: I'll check the details for that ad ID.

[Claude uses check_ad_id tool]

Based on the ad ID 120222861998810312, here's the complete hierarchy:

**Ad Details:**
- Name: Summer Sale - Image Ad
- Status: ACTIVE
- Created: June 15, 2025

**Belongs to Ad Set:**
- Name: Target Audience 18-35
- ID: 23851234567890
- Status: ACTIVE

**Part of Campaign:**
- Name: Summer 2025 Campaign
- ID: 23850987654321
- Objective: Drive Traffic
- Status: ACTIVE

**In Account:**
- Name: My Business Account
- ID: act_123456789
- Currency: USD
- Timezone: America/New_York

The ad is currently active and part of an active traffic campaign targeting 18-35 year olds.
```

## Error Handling

The tool handles various error scenarios:

1. **Invalid Ad ID**: Returns error message with code
2. **No Access**: If user doesn't have permission to view the ad
3. **Ad Not Found**: If the ad ID doesn't exist
4. **Partial Data**: Still returns available information if some fields are missing

## Technical Implementation

The tool uses Facebook Graph API v23.0 to fetch:
- Ad details with nested adset and campaign information
- Ad account details in a separate call for complete information
- All data in a single efficient request when possible

## Benefits

1. **Time Saving**: No need to navigate through Ads Manager to find ad relationships
2. **Debugging**: Quickly identify where problematic ads are located
3. **Automation**: Integrate with scripts and workflows for ad auditing
4. **Support**: Help users understand their ad structure instantly

## Limitations

- Requires appropriate permissions to view the ad
- Ad must exist and not be deleted
- Returns only current state (not historical data)
- Limited to information available through Graph API

## Future Enhancements

Potential improvements could include:
- Historical status tracking
- Performance metrics integration
- Bulk ad ID checking
- Export to CSV/JSON format
- Creative preview links
