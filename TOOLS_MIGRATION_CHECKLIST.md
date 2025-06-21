# Facebook Ads MCP Tools Migration Checklist
## Total: 77 Tools

### ✅ Campaign Tools (7 tools) - campaign-tools.ts
- [x] create_campaign - Already using SDK
- [x] get_campaigns - Already using SDK
- [x] get_campaign_details - Already using SDK
- [x] update_campaign - Already using SDK
- [x] delete_campaign - Already using SDK
- [x] get_campaign_insights - Already using SDK
- [x] duplicate_campaign - Already using SDK

### ✅ Ad Set Tools (5 tools) - adset-tools.ts
- [x] create_ad_set - Already using SDK
- [x] update_ad_set - Already using SDK
- [x] delete_ad_set - Already using SDK
- [x] duplicate_ad_set - Already using SDK
- [x] get_ad_set_insights - Already using SDK

### ✅ Ad Tools (6 tools) - ad-tools.ts
- [x] create_ad - Already using SDK
- [x] create_ad_creative - Already using SDK
- [x] update_ad - Already using SDK
- [x] delete_ad - Already using SDK
- [x] duplicate_ad - Already using SDK
- [x] get_ad_insights - Already using SDK

### ✅ Audience Tools (3 tools) - audience-tools.ts
- [x] create_custom_audience - Already using SDK
- [x] get_audiences - Already using SDK
- [x] create_lookalike_audience - Already using SDK
- [x] update_custom_audience - Already using SDK

### ❌ Account Insights Tools (3 tools) - account-insights-tools.ts
- [ ] get_account_insights - Uses fetch API
- [ ] get_total_spend_all_accounts - Uses fetch API
- [ ] get_spend_by_campaign - Uses fetch API

### ❌ Page Tools (47 tools) - page-tools.ts
- [ ] get_facebook_pages - Uses fetch API
- [ ] get_page_details - Already using SDK
- [ ] create_page_post - Already using SDK
- [ ] update_page_post - Already using SDK
- [ ] delete_page_post - Already using SDK
- [ ] get_page_posts - Already using SDK
- [ ] get_page_insights - Already using SDK
- [ ] schedule_page_post - Already using SDK
- [ ] get_scheduled_posts - Already using SDK
- [ ] publish_scheduled_post - Already using SDK
- [ ] cancel_scheduled_post - Already using SDK
- [ ] get_page_videos - Already using SDK
- [ ] upload_page_video - Already using SDK
- [ ] get_page_events - Already using SDK
- [ ] create_page_event - Already using SDK
- [ ] update_page_event - Already using SDK
- [ ] delete_page_event - Already using SDK
- [ ] get_page_fan_count - Already using SDK
- [ ] reply_to_comment - Already using SDK
- [ ] get_post_comments - Already using SDK
- [ ] delete_comment - Already using SDK
- [ ] delete_comment_from_post - Already using SDK
- [ ] filter_negative_comments - Already using SDK
- [ ] get_number_of_comments - Already using SDK
- [ ] get_number_of_likes - Already using SDK
- [ ] get_post_impressions - Already using SDK
- [ ] get_post_impressions_unique - Already using SDK
- [ ] get_post_impressions_paid - Already using SDK
- [ ] get_post_impressions_organic - Already using SDK
- [ ] get_post_engaged_users - Already using SDK
- [ ] get_post_clicks - Already using SDK
- [ ] get_post_reactions_like_total - Already using SDK
- [ ] get_post_top_commenters - Already using SDK
- [ ] post_image_to_facebook - Already using SDK
- [ ] get_post_share_count - Already using SDK
- [ ] send_dm_to_user - Already using SDK

### ✅ Ads Library Tools (5 tools) - ads-library-tools.ts
- [x] get_meta_platform_id - No fetch (direct return)
- [x] get_meta_ads - Already using SDK
- [x] search_ads_library - Already using SDK
- [x] get_competitor_ads_analysis - Already using SDK
- [x] get_page_details - Already using SDK

### ✅ Lead Tracking Tools (3 tools) - lead-tracking-tools.ts
- [x] get_leads_data - External API (Laravel)
- [x] get_leads_with_insights - External API + SDK
- [x] check_ad_id - Already using SDK

### ✅ Cron Job Tools (7 tools) - cron-job-tools.ts
- [x] create_cron_job - External API (cron-job.org)
- [x] get_cron_job_details - External API
- [x] update_cron_job - External API
- [x] delete_cron_job - External API
- [x] get_cron_job_history - External API
- [x] get_cron_job_history_details - External API
- [x] list_cron_jobs - External API

### ✅ Analytics Tools (1 tool) - analytics-tools.ts
- [x] generate_campaign_prompt - No API calls

### ❌ Authentication Tools (2 tools) - http-server.ts
- [ ] get_ad_accounts - Uses fetch in http-server
- [ ] select_ad_account - Already using SDK

## Summary:
- ✅ Already migrated: 72 tools
- ❌ Need migration: 5 tools
  - account-insights-tools.ts: 3 tools
  - page-tools.ts: 1 tool (get_facebook_pages)
  - http-server.ts: 1 tool (get_ad_accounts)

## Migration Priority:
1. account-insights-tools.ts - Fix fetch calls
2. page-tools.ts - Fix get_facebook_pages
3. http-server.ts - Fix get_ad_accounts endpoint