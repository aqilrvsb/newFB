const fs = require('fs');
const path = require('path');

console.log('🔧 Reverting to direct Facebook SDK calls instead of wrapper\n');

// Files to update
const files = [
  'src/http-server.ts',
  'src/tools/account-insights-tools.ts', 
  'src/tools/ad-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/page-tools.ts'
];

// First, remove the wrapper imports
files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the import line
  content = content.replace(/import { sdkFetch } from ['"].*facebook-sdk-wrapper['"];?\n/g, '');
  
  // Change sdkFetch back to fetch temporarily
  content = content.replace(/sdkFetch\(/g, 'fetch(');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Cleaned ${file}`);
});

// Now let's implement a simpler fix directly in http-server.ts
const httpServerPath = path.join(__dirname, 'src/http-server.ts');
let httpContent = fs.readFileSync(httpServerPath, 'utf8');

// Add a simple fetch polyfill at the top of http-server.ts
const fetchPolyfill = `
// Polyfill for fetch using Facebook SDK for Graph API calls
const originalFetch = global.fetch;
global.fetch = async function(url: string, options?: any) {
  // Only intercept Facebook Graph API calls
  if (typeof url === 'string' && url.includes('graph.facebook.com')) {
    try {
      const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
      const api = FacebookAdsApi.getDefaultApi();
      
      // Parse URL
      const urlObj = new URL(url);
      const endpoint = urlObj.pathname.replace(/^\\/v\\d+\\.\\d+\\//, '');
      const params: any = {};
      
      urlObj.searchParams.forEach((value, key) => {
        if (key !== 'access_token') {
          params[key] = value;
        }
      });
      
      // Parse body if present
      let data = null;
      if (options?.body) {
        try {
          data = JSON.parse(options.body);
        } catch (e) {
          const formData = new URLSearchParams(options.body);
          const dataObj: any = {};
          formData.forEach((value, key) => {
            dataObj[key] = value;
          });
          data = dataObj;
        }
      }
      
      // Make API call
      const method = options?.method || 'GET';
      const result = await api.call(method, [endpoint], params, data);
      
      // Return fetch-like response
      return {
        ok: true,
        status: 200,
        json: async () => result,
        text: async () => JSON.stringify(result)
      };
    } catch (error: any) {
      // Return error in fetch format
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: error.message || 'Unknown error',
            type: 'GraphAPIError'
          }
        }),
        text: async () => JSON.stringify({ error: error.message })
      };
    }
  }
  
  // For non-Facebook URLs, use original fetch if available
  if (originalFetch) {
    return originalFetch(url, options);
  }
  
  // If no fetch available, try node-fetch
  try {
    const nodeFetch = require('node-fetch');
    return nodeFetch.default(url, options);
  } catch (e) {
    throw new Error('fetch is not available');
  }
};
`;

// Add the polyfill after imports
const importEndIndex = httpContent.lastIndexOf('import');
const importEndLineIndex = httpContent.indexOf('\n', importEndIndex);
httpContent = httpContent.slice(0, importEndLineIndex + 1) + '\n' + fetchPolyfill + '\n' + httpContent.slice(importEndLineIndex + 1);

fs.writeFileSync(httpServerPath, httpContent);
console.log('\n✅ Added fetch polyfill to http-server.ts');

// Remove the facebook-sdk-wrapper.ts file
const wrapperPath = path.join(__dirname, 'src/utils/facebook-sdk-wrapper.ts');
if (fs.existsSync(wrapperPath)) {
  fs.unlinkSync(wrapperPath);
  console.log('✅ Removed facebook-sdk-wrapper.ts');
}

console.log('\n✅ Migration complete! Using global fetch polyfill for Facebook API calls.');
