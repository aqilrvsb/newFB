// Fix for post metrics in page-tools.ts
const fixPostMetrics = `
// Update the getPostMetrics function to use correct v23.0 metric names
const response = await fetch(
  \`https://graph.facebook.com/v23.0/\${postId}/insights?metric=post_impressions,post_impressions_unique,post_impressions_paid,post_impressions_organic,post_engaged_users,post_clicks&access_token=\${pageAccessToken}\`
);
`;

// This fix separates the insights endpoint from the regular post data
// Facebook v23.0 requires using the /insights endpoint directly for post metrics
