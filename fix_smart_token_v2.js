// Smart Token Fix - Version 2 (No getAllSessions)
const fs = require('fs');
const path = require('path');

const pageToolsPath = path.join(__dirname, 'src/tools/page-tools.ts');

console.log('🔧 Applying Smart Token Fix v2 (Session Compatible)...');

// Read the current file
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Find and replace the problematic getAllSessions calls with a working approach
content = content.replace(
  /const allSessions = userSessionManager\.getAllSessions\(\);/g,
  '// Use current session approach - try with user ID from smartApiCall'
);

content = content.replace(
  /if \(allSessions && allSessions\.length > 0\) \{[\s\S]*?for \(const session of allSessions\) \{[\s\S]*?const userToken = session\.credentials\.facebookAccessToken;/g,
  `// Get session for current user
      const session = userSessionManager.getSession(userId);
      if (session) {
        const userToken = session.credentials.facebookAccessToken;`
);

// Fix the session loop closing
content = content.replace(
  /\}\s*\}\s*\} catch \(pagesError\) \{[\s\S]*?\}\s*\}\s*\} catch \(sessionError\) \{/g,
  `} catch (pagesError) {
          // Page token failed, continue to fallback
        }
      } catch (sessionError) {`
);

// Write the updated file
fs.writeFileSync(pageToolsPath, content);

console.log('✅ Smart Token Fix v2 Applied!');
console.log('📋 Changes:');
console.log('  • Removed getAllSessions dependency');
console.log('  • Uses existing getSession method');
console.log('  • Maintains smart token fallback logic');
console.log('🚀 Ready for build!');
