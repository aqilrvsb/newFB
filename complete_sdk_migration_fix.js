const fs = require('fs').promises;
const path = require('path');

// Migration rules for converting fetch to SDK
const migrationRules = {const fs = require('fs').promises;
const path = require('path');

// Migration rules for converting fetch to SDK
const migrationRules = {
  // Account insights
  'account-insights-tools.ts': {
    patterns: [
      {
        // Convert account insights fetch to SDK
        search: /const insightsUrl = `https:\/\/graph\.facebook\.com\/v\d+\.\d+\/\$\{account\.id\}\/insights\?fields=([^`]+)`;\s*const insightsResponse = await fetch\(insightsUrl\);\s*const insightsData = await insightsResponse\.json\(\) as any;/g,
        replace: `const adAccount = new AdAccount(account.id);
        const insightsData = await adAccount.getInsights(
          ['spend', 'impressions', 'clicks', 'cpm', 'cpc', 'ctr'],
          { date_preset: dateRange }
        );`
      },
      {
        // Fix the campaign insights fetch
        search: /const campaignsUrl = `https:\/\/graph\.facebook\.com\/v\d+\.\d+\/\$\{account\.id\}\/campaigns\?fields=([^`]+)`;\s*const campaignsResponse = await fetch\(campaignsUrl\);\s*const campaignsData = await campaignsResponse\.json\(\) as any;/g,
        replace: `const adAccount = new AdAccount(account.id);
        const campaignsData = await adAccount.getCampaigns(
          ['id', 'name', 'status', 'insights{spend,impressions,clicks,cpm,cpc,ctr}'],
          { date_preset: dateRange, limit: 100 }
        );`
      }
    ]
  },
  // Page tools
  'page-tools.ts': {
    patterns: [
      {
        // Convert page access token fetch to SDK
        search: /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/v\d+\.\d+\/\$\{pageId\}\?fields=access_token&access_token=\$\{[^}]+\}`\s*\);[^}]+const data = await response\.json\(\);/g,
        replace: `const page = new Page(pageId);
        const data = await page.get(['access_token']);`
      },
      {
        // Convert user pages fetch to SDK
        search: /const url = `https:\/\/graph\.facebook\.com\/v\d+\.\d+\/me\/accounts\?fields=([^`]+)`;\s*const response = await fetch\(url\);\s*const data = await response\.json\(\);/g,
        replace: `const user = new User('me');
        const pagesData = await user.getAccounts(
          ['id', 'name', 'access_token', 'category', 'tasks'],
          { limit: 100 }
        );
        const data = { data: pagesData };`
      }
    ]
  },
  // Lead tracking tools
  'lead-tracking-tools.ts': {
    patterns: [
      {
        // External API calls remain as fetch (Laravel backend)
        search: /fetch\(/g,
        replace: 'fetch(',
        skip: true // Don't modify external API calls
      }
    ]
  },
  // Cron job tools
  'cron-job-tools.ts': {
    patterns: [
      {
        // External API calls remain as fetch (cron-job.org)
        search: /fetch\(/g,
        replace: 'fetch(',
        skip: true // Don't modify external API calls
      }
    ]
  }
};

// TypeScript fixes
const typeScriptFixes = {
  // Fix common TypeScript errors
  patterns: [
    {
      // Fix missing AdAccount import
      search: /import \{ ([^}]+) \} from 'facebook-nodejs-business-sdk';/g,
      replace: (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        if (!importList.includes('AdAccount')) {
          importList.push('AdAccount');
        }
        if (!importList.includes('Page')) {
          importList.push('Page');
        }
        if (!importList.includes('User')) {
          importList.push('User');
        }
        return `import { ${importList.join(', ')} } from 'facebook-nodejs-business-sdk';`;
      }
    },
    {
      // Fix async/await in map
      search: /\.map\(async \(([^)]+)\) => \{/g,
      replace: '.map(async ($1) => {'
    },
    {
      // Fix Promise.all with async map
      search: /await Promise\.all\(\s*([^.]+)\.map\(async/g,
      replace: 'await Promise.all(\n      $1.map(async'
    },
    {
      // Fix missing error types
      search: /catch \(error\) \{/g,
      replace: 'catch (error: any) {'
    },
    {
      // Fix missing return types
      search: /export const (\w+) = async \(/g,
      replace: 'export const $1 = async ('
    }
  ]
};

// HTTP server fixes
const httpServerFixes = {
  patterns: [
    {
      // Fix switch statement structure
      search: /case '([^']+)':\s*\{([^}]+)\}/g,
      replace: (match, caseName, content) => {
        // Ensure proper break statement
        if (!content.includes('break;') && !content.includes('return')) {
          return `case '${caseName}': {${content}
        break;
      }`;
        }
        return match;
      }
    },
    {
      // Fix missing async declarations
      search: /handler: \(params: any\) => \{/g,
      replace: 'handler: async (params: any) => {'
    },
    {
      // Fix getUserId endpoint
      search: /const getUserId = async[^{]+\{[^}]+\}/g,
      replace: `const getUserId = async (accessToken: string): Promise<string> => {
    try {
      const { User } = require('facebook-nodejs-business-sdk');
      const user = new User('me');
      const userData = await user.get(['id']);
      return userData.id;
    } catch (error) {
      throw new Error('Failed to get user ID: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }`
    }
  ]
};

async function migrateFile(filePath, rules) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Apply migration rules
    for (const pattern of rules.patterns) {
      if (!pattern.skip) {
        const newContent = content.replace(pattern.search, pattern.replace);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    // Apply TypeScript fixes
    for (const pattern of typeScriptFixes.patterns) {
      const newContent = content.replace(pattern.search, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      // Create backup
      const backupPath = filePath + '.backup.' + Date.now();
      await fs.writeFile(backupPath, await fs.readFile(filePath, 'utf8'));
      
      // Write updated file
      await fs.writeFile(filePath, content);
      console.log(`✅ Migrated: ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

async function fixHttpServer() {
  const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
  
  try {
    let content = await fs.readFile(httpServerPath, 'utf8');
    let modified = false;
    
    // Apply HTTP server specific fixes
    for (const pattern of httpServerFixes.patterns) {
      const newContent = content.replace(pattern.search, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    // Fix fetch calls in http-server
    const fetchPattern = /const response = await fetch\(`https:\/\/graph\.facebook\.com[^`]+`\);[^}]+const data = await response\.json\(\);/g;
    
    content = content.replace(fetchPattern, (match) => {
      if (match.includes('/me?fields=id')) {
        return `const { User } = require('facebook-nodejs-business-sdk');
      const user = new User('me');
      const data = await user.get(['id']);`;
      }
      return match;
    });
    
    if (modified) {
      // Create backup
      const backupPath = httpServerPath + '.backup.' + Date.now();
      await fs.writeFile(backupPath, await fs.readFile(httpServerPath, 'utf8'));
      
      // Write updated file
      await fs.writeFile(httpServerPath, content);
      console.log('✅ Fixed http-server.ts');
    }
  } catch (error) {
    console.error('❌ Error fixing http-server.ts:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting complete SDK migration and TypeScript fixes...\n');
  
  const toolsDir = path.join(__dirname, 'src', 'tools');
  const files = await fs.readdir(toolsDir);
  
  let migrated = 0;
  
  // Process each tool file
  for (const file of files) {
    if (file.endsWith('.ts') && !file.includes('.backup')) {
      const filePath = path.join(toolsDir, file);
      const rules = migrationRules[file] || { patterns: [] };
      
      if (await migrateFile(filePath, rules)) {
        migrated++;
      }
    }
  }
  
  // Fix http-server.ts
  await fixHttpServer();
  
  console.log(`\n✅ Migration complete! Migrated ${migrated} files.`);
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Check for any remaining TypeScript errors');
  console.log('3. Test the functionality');
}

main().catch(console.error);