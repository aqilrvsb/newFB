// Smart token fallback system for Facebook API calls
const fs = require('fs');
const path = require('path');

console.log('🔧 Adding smart token fallback system...');

const filePath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add smart token helper function after the existing getPageAccessToken function
const smartTokenFunction = `
// Smart token fallback - Try user token first, then page token
async function smartApiCall(
  userId: string, 
  postId: string, 
  endpoint: string, 
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      return { success: false, message: 'User session not found' };
    }

    // Extract page ID from post ID if possible
    const pageId = postId.includes('_') ? postId.split('_')[0] : postId;
    
    // Get both tokens
    const userToken = session.credentials.facebookAccessToken;
    const pageToken = await getPageAccessToken(userId, pageId);
    
    // Try user token first
    try {
      const userUrl = \`https://graph.facebook.com/v23.0/\${endpoint}?access_token=\${userToken}\`;
      const userOptions: any = { method };
      if (body && method !== 'GET') {
        userOptions.headers = { 'Content-Type': 'application/json' };
        userOptions.body = JSON.stringify(body);
      }
      
      const userResponse = await fetch(userUrl, userOptions);
      const userData = await userResponse.json();
      
      // If user token works, return the result
      if (!userData.error) {
        return { success: true, data: userData };
      }
    } catch (userError) {
      console.log('User token failed, trying page token...');
    }
    
    // If user token fails, try page token
    if (pageToken) {
      try {
        const pageUrl = \`https://graph.facebook.com/v23.0/\${endpoint}?access_token=\${pageToken}\`;
        const pageOptions: any = { method };
        if (body && method !== 'GET') {
          pageOptions.headers = { 'Content-Type': 'application/json' };
          pageOptions.body = JSON.stringify(body);
        }
        
        const pageResponse = await fetch(pageUrl, pageOptions);
        const pageData = await pageResponse.json();
        
        if (!pageData.error) {
          return { success: true, data: pageData };
        }
        
        return { success: false, message: pageData.error.message };
      } catch (pageError) {
        return { success: false, message: 'Both user and page tokens failed' };
      }
    }
    
    return { success: false, message: 'No valid tokens available' };
    
  } catch (error) {
    return { 
      success: false, 
      message: \`Smart API call failed: \${error instanceof Error ? error.message : 'Unknown error'}\` 
    };
  }
}

`;

// Insert the smart token function after the getPageAccessToken function
content = content.replace(
  'async function getUserFacebookPages(accessToken: string): Promise<any> {',
  smartTokenFunction + '\nasync function getUserFacebookPages(accessToken: string): Promise<any> {'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Added smart token fallback system');
console.log('📋 Function tries user token first, then page token automatically');
console.log('🚀 This will handle all authentication scenarios');
