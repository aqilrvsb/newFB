const fs = require('fs').promises;
const path = require('path');

async function fixHttpServerFunctionNames() {
  const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
  
  try {
    let content = await fs.readFile(httpServerPath, 'utf8');
    
    // Fix function name mismatches
    const replacements = [
      // Page tools function name fixes
      { from: /pageTools\.postToFacebook/g, to: 'pageTools.createPagePost' },
      { from: /pageTools\.deletePost/g, to: 'pageTools.deletePagePost' },
      { from: /pageTools\.getPostMetrics/g, to: 'pageTools.getPageInsights' },
      { from: /pageTools\.updatePost/g, to: 'pageTools.updatePagePost' },
      { from: /pageTools\.schedulePost/g, to: 'pageTools.schedulePagePost' },
      { from: /pageTools\.getCommentsFixed/g, to: 'pageTools.getPostComments' },
    ];
    
    // Apply replacements
    for (const { from, to } of replacements) {
      content = content.replace(from, to);
    }
    
    // Create backup
    const backupPath = httpServerPath + '.backup.' + Date.now();
    await fs.writeFile(backupPath, await fs.readFile(httpServerPath, 'utf8'));
    
    // Write updated file
    await fs.writeFile(httpServerPath, content);
    console.log('✅ Fixed function names in http-server.ts');
    
  } catch (error) {
    console.error('❌ Error fixing http-server.ts:', error.message);
  }
}

fixHttpServerFunctionNames().catch(console.error);