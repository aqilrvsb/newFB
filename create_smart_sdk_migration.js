const fs = require('fs');
const path = require('path');

console.log('🎯 Smart Facebook SDK Migration - Replacing Facebook fetch calls only\n');

// Create the utils directory if it doesn't exist
const utilsDir = path.join(__dirname, 'src', 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Create a more comprehensive SDK wrapper
const sdkWrapper = `/**
 * Facebook SDK Wrapper for Railway Compatibility
 * Replaces fetch calls with Facebook SDK methods
 */

import { 
  FacebookAdsApi, 
  User, 
  AdAccount, 
  Campaign, 
  AdSet, 
  Ad, 
  Page,
  CustomAudience,
  AdCreative,
  Business
} from 'facebook-nodejs-business-sdk';

// Helper to extract fields from query string
function parseFields(fieldsString: string): string[] {
  if (!fieldsString) return [];
  return fieldsString.split(',').map(f => f.trim());
}

// Helper to parse Facebook Graph URL
function parseGraphUrl(url: string): { endpoint: string; params: any } {
  const urlObj = new URL(url);
  const endpoint = urlObj.pathname.replace(/^\\/v\\d+\\.\\d+\\//, '');
  const params: any = {};
  
  urlObj.searchParams.forEach((value, key) => {
    if (key === 'fields') {
      // Don't parse fields here, keep as string
      params[key] = value;
    } else if (key === 'access_token') {
      // Skip access token as SDK handles it
    } else {
      params[key] = value;
    }
  });
  
  return { endpoint, params };
}

/**
 * Main function to replace fetch calls to Facebook Graph API
 * @param url - The Facebook Graph API URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise with the API response
 */
export async function facebookSdkRequest(url: string, options: any = {}): Promise<any> {
  // Only handle Facebook URLs
  if (!url.includes('graph.facebook.com')) {
    // For non-Facebook URLs, fall back to regular fetch
    const fetch = (await import('node-fetch')).default;
    return fetch(url, options);
  }

  const { endpoint, params } = parseGraphUrl(url);
  const method = options.method || 'GET';
  
  // Parse body if present
  let bodyData: any = {};
  if (options.body) {
    try {
      bodyData = JSON.parse(options.body);
    } catch (e) {
      // Parse form data
      const formData = new URLSearchParams(options.body);
      formData.forEach((value, key) => {
        bodyData[key] = value;
      });
    }
  }

  // Extract fields
  const fields = params.fields ? parseFields(params.fields) : [];
  delete params.fields; // Remove fields from params as SDK handles it separately

  try {
    const pathParts = endpoint.split('/').filter(p => p);
    const objectId = pathParts[0];
    const edge = pathParts[1];
    const subEdge = pathParts[2];

    // Handle 'me' endpoints
    if (objectId === 'me') {
      const user = new User('me');
      
      switch (edge) {
        case 'adaccounts':
          return await user.getAdAccounts(fields, params);
          
        case 'accounts':
          const accounts = await user.getAccounts(fields, params);
          // Convert to expected format
          return { data: accounts };
          
        case 'messages':
          // For messages, use direct API call
          const api = FacebookAdsApi.getDefaultApi();
          return await api.call(method, ['me/messages'], params, bodyData);
          
        default:
          const api = FacebookAdsApi.getDefaultApi();
          return await api.call(method, [endpoint], params, bodyData);
      }
    }

    // Handle Page operations
    if (edge === 'feed' || edge === 'posts' || edge === 'photos' || edge === 'videos' || 
        edge === 'events' || edge === 'insights' || edge === 'scheduled_posts' ||
        edge === 'promotable_posts' || edge === 'published_posts') {
      const page = new Page(objectId);
      
      switch (edge) {
        case 'feed':
          if (method === 'POST') {
            const result = await page.createFeed([], bodyData);
            return { id: result.id };
          } else {
            const posts = await page.getFeed(fields, params);
            return { data: posts };
          }
          
        case 'posts':
          const posts = await page.getPosts(fields, params);
          return { data: posts };
          
        case 'photos':
          if (method === 'POST') {
            const result = await page.createPhoto([], bodyData);
            return { id: result.id };
          }
          break;
          
        case 'videos':
          if (method === 'POST') {
            const result = await page.createVideo([], bodyData);
            return { id: result.id };
          } else {
            const videos = await page.getVideos(fields, params);
            return { data: videos };
          }
          
        case 'insights':
          const insights = await page.getInsights(fields, params);
          return { data: insights };
          
        case 'events':
          if (method === 'POST') {
            const result = await page.createEvent([], bodyData);
            return { id: result.id };
          } else {
            const events = await page.getEvents(fields, params);
            return { data: events };
          }
          
        default:
          // For other page edges, use direct API call
          const api = FacebookAdsApi.getDefaultApi();
          return await api.call(method, [endpoint], params, bodyData);
      }
    }

    // Handle Ad Account operations
    if (objectId.startsWith('act_')) {
      const account = new AdAccount(objectId);
      
      switch (edge) {
        case 'campaigns':
          if (method === 'POST') {
            const result = await account.createCampaign([], bodyData);
            return { id: result.id };
          } else {
            const campaigns = await account.getCampaigns(fields, params);
            return { data: campaigns };
          }
          
        case 'adsets':
          if (method === 'POST') {
            const result = await account.createAdSet([], bodyData);
            return { id: result.id };
          } else {
            const adsets = await account.getAdSets(fields, params);
            return { data: adsets };
          }
          
        case 'ads':
          if (method === 'POST') {
            const result = await account.createAd([], bodyData);
            return { id: result.id };
          } else {
            const ads = await account.getAds(fields, params);
            return { data: ads };
          }
          
        case 'customaudiences':
          if (method === 'POST') {
            const result = await account.createCustomAudience([], bodyData);
            return { id: result.id };
          } else {
            const audiences = await account.getCustomAudiences(fields, params);
            return { data: audiences };
          }
          
        case 'insights':
          const insights = await account.getInsights(fields, params);
          return { data: insights };
          
        default:
          const api = FacebookAdsApi.getDefaultApi();
          return await api.call(method, [endpoint], params, bodyData);
      }
    }

    // Handle Comment operations
    if (edge === 'comments' || pathParts.some(p => p === 'comments')) {
      if (method === 'POST') {
        const api = FacebookAdsApi.getDefaultApi();
        const result = await api.call('POST', [endpoint], {}, bodyData);
        return { id: result.id };
      } else if (method === 'DELETE') {
        const api = FacebookAdsApi.getDefaultApi();
        return await api.call('DELETE', [endpoint], params);
      } else {
        const api = FacebookAdsApi.getDefaultApi();
        const result = await api.call('GET', [endpoint], params);
        return result;
      }
    }

    // Handle DELETE operations
    if (method === 'DELETE') {
      const api = FacebookAdsApi.getDefaultApi();
      return await api.call('DELETE', [endpoint], params);
    }

    // Handle insights endpoints
    if (edge === 'insights' || subEdge === 'insights') {
      const api = FacebookAdsApi.getDefaultApi();
      const result = await api.call('GET', [endpoint], params);
      return result;
    }

    // For specific object GET requests
    if (!edge && method === 'GET') {
      const api = FacebookAdsApi.getDefaultApi();
      const result = await api.call('GET', [endpoint], params);
      return result;
    }

    // Default: Use direct API call
    const api = FacebookAdsApi.getDefaultApi();
    return await api.call(method, [endpoint], params, bodyData);

  } catch (error: any) {
    // Format error to match fetch response
    if (error.response) {
      return {
        error: {
          message: error.response.error.message,
          type: error.response.error.type,
          code: error.response.error.code
        }
      };
    }
    throw error;
  }
}

/**
 * Wrapper that mimics fetch API but uses Facebook SDK
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with response-like object
 */
export async function sdkFetch(url: string, options: any = {}): Promise<any> {
  const data = await facebookSdkRequest(url, options);
  
  // Return fetch-like response object
  return {
    ok: !data.error,
    status: data.error ? 400 : 200,
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}
`;

// Save the SDK wrapper
fs.writeFileSync(
  path.join(utilsDir, 'facebook-sdk-wrapper.ts'),
  sdkWrapper.trim()
);

console.log('✅ Created src/utils/facebook-sdk-wrapper.ts');

// Create the migration application script
const migrationScript = `
const fs = require('fs');
const path = require('path');

console.log('🔄 Applying Facebook SDK migration...\\n');

// Files to process
const files = [
  'src/http-server.ts',
  'src/tools/page-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/audience-tools.ts',
  'src/tools/analytics-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/account-insights-tools.ts'
];

let totalReplaced = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if file has Facebook API calls
  if (!content.includes('graph.facebook.com')) return;
  
  // Add import if not present
  if (!content.includes('facebook-sdk-wrapper')) {
    // Find the right place to add import (after other imports)
    const importRegex = /^import.*from.*;$/gm;
    const imports = content.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      const importStatement = "\\nimport { sdkFetch } from '../utils/facebook-sdk-wrapper.js';";
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
    } else {
      // Add at the beginning if no imports found
      content = "import { sdkFetch } from '../utils/facebook-sdk-wrapper.js';\\n" + content;
    }
  }
  
  // Replace fetch calls that use graph.facebook.com
  let replacements = 0;
  
  // Pattern 1: await fetch(\`https://graph.facebook.com/...
  content = content.replace(
    /await fetch\\((\`[^)]*graph\\.facebook\\.com[^)]*\`)([^)]*)?\\)/g,
    (match, url, options) => {
      replacements++;
      return \`await sdkFetch(\${url}\${options || ''})\`;
    }
  );
  
  // Pattern 2: await fetch('https://graph.facebook.com/...
  content = content.replace(
    /await fetch\\(('[^)]*graph\\.facebook\\.com[^)]*')([^)]*)?\\)/g,
    (match, url, options) => {
      replacements++;
      return \`await sdkFetch(\${url}\${options || ''})\`;
    }
  );
  
  // Pattern 3: await fetch("https://graph.facebook.com/...
  content = content.replace(
    /await fetch\\(("[^)]*graph\\.facebook\\.com[^)]*")([^)]*)?\\)/g,
    (match, url, options) => {
      replacements++;
      return \`await sdkFetch(\${url}\${options || ''})\`;
    }
  );
  
  if (replacements > 0) {
    // Create backup
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, originalContent);
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    
    console.log(\`✅ \${file}: Replaced \${replacements} Facebook fetch calls\`);
    console.log(\`   Backup saved to: \${path.basename(backupPath)}\`);
    totalReplaced += replacements;
    filesModified++;
  }
});

console.log(\`\\n🎉 Migration complete!\`);
console.log(\`   Files modified: \${filesModified}\`);
console.log(\`   Total Facebook fetch calls replaced: \${totalReplaced}\`);
console.log(\`\\n📋 Note: Non-Facebook fetch calls (cron-job.org, Laravel) were preserved.\`);
`;

fs.writeFileSync(
  path.join(__dirname, 'apply_facebook_sdk_migration.js'),
  migrationScript.trim()
);

console.log('✅ Created apply_facebook_sdk_migration.js');
console.log('\n📋 Migration Summary:');
console.log('- Created comprehensive Facebook SDK wrapper');
console.log('- Will ONLY replace Facebook Graph API fetch calls');
console.log('- Preserves non-Facebook fetch calls (cron-job.org, Laravel)');
console.log('- Maintains backward compatibility');
console.log('\n🚀 Run: node apply_facebook_sdk_migration.js to apply the migration');
