const fs = require('fs').promises;
const path = require('path');

async function extractAllTools() {
  const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
  const content = await fs.readFile(httpServerPath, 'utf8');
  
  // Extract all case statements from the switch
  const caseRegex = /case '([^']+)':/g;
  const tools = [];
  let match;
  
  while ((match = caseRegex.exec(content)) !== null) {
    const tool = match[1];
    // Filter out HTTP methods and other non-tool cases
    if (!['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'].includes(tool) && 
        !tool.includes('/') && 
        tool !== 'default') {
      tools.push(tool);
    }
  }
  
  // Remove duplicates and sort
  const uniqueTools = [...new Set(tools)].sort();
  
  console.log(`Found ${uniqueTools.length} tools in http-server.ts:\n`);
  uniqueTools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool}`);
  });
  
  // Save to file
  await fs.writeFile('ALL_TOOLS_LIST.txt', uniqueTools.join('\n'));
  console.log('\nSaved to ALL_TOOLS_LIST.txt');
}

extractAllTools().catch(console.error);