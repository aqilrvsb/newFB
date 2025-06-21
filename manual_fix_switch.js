const fs = require('fs');
const path = require('path');

console.log('🔧 Manually fixing switch statement in http-server.ts\n');

const filePath = path.join(__dirname, 'src/http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Create backup
const backupPath = filePath + '.backup.manual.' + Date.now();
fs.copyFileSync(filePath, backupPath);
console.log(`✅ Created backup: ${path.basename(backupPath)}`);

// Find the processMcpToolCall function and rebuild it properly
const functionStartPattern = /async function processMcpToolCall\(/;
const functionStart = content.search(functionStartPattern);

if (functionStart === -1) {
  console.error('❌ Could not find processMcpToolCall function');
  process.exit(1);
}

// Extract everything before the function
const beforeFunction = content.substring(0, functionStart);

// Find where the function should end (look for the closing of the main function)
// We'll rebuild the function with proper structure
const newFunction = `async function processMcpToolCall(toolName: string, args: any, userId: string): Promise<any> {
  const session = userSessionManager.getSession(userId);
  if (!session) {
    throw new Error('Invalid session');
  }

  // Initialize Facebook API with user's credentials
  const FacebookAdsApi = require('facebook-nodejs-business-sdk').FacebookAdsApi;
  const Campaign = require('facebook-nodejs-business-sdk').Campaign;
  const AdAccount = require('facebook-nodejs-business-sdk').AdAccount;
  
  FacebookAdsApi.init(session.credentials.facebookAccessToken);

  try {
    switch (toolName) {`;

// Now we need to extract all the case statements and ensure they're properly formatted
// Let's find all case statements in the original content
const lines = content.split('\n');
let inFunction = false;
let cases = [];
let currentCase = null;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function processMcpToolCall')) {
    inFunction = true;
    continue;
  }
  
  if (!inFunction) continue;
  
  // Track braces to know when we're done
  for (const char of lines[i]) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  
  // Look for case statements
  if (lines[i].trim().startsWith('case \'')) {
    if (currentCase) {
      cases.push(currentCase);
    }
    currentCase = {
      name: lines[i].trim(),
      lines: [lines[i]]
    };
  } else if (currentCase) {
    currentCase.lines.push(lines[i]);
    
    // Check if this case is complete (look for the next case or default)
    if (i + 1 < lines.length && 
        (lines[i + 1].trim().startsWith('case \'') || 
         lines[i + 1].trim().startsWith('default:'))) {
      // Remove trailing empty lines
      while (currentCase.lines.length > 0 && 
             currentCase.lines[currentCase.lines.length - 1].trim() === '') {
        currentCase.lines.pop();
      }
    }
  }
  
  // Check for default case
  if (lines[i].trim().startsWith('default:')) {
    if (currentCase) {
      cases.push(currentCase);
      currentCase = null;
    }
    // Capture default case
    let defaultLines = [lines[i]];
    for (let j = i + 1; j < lines.length && j < i + 20; j++) {
      defaultLines.push(lines[j]);
      if (lines[j].includes('};')) break;
    }
    cases.push({
      name: 'default:',
      lines: defaultLines
    });
    break;
  }
}

// Add the last case if exists
if (currentCase) {
  cases.push(currentCase);
}

console.log(`Found ${cases.length} case statements`);

// Rebuild the function with proper structure
let rebuiltFunction = newFunction + '\n';

// Add all cases
cases.forEach((caseObj, index) => {
  if (caseObj.name === 'default:') {
    rebuiltFunction += '\n      default:\n';
    rebuiltFunction += '        return {\n';
    rebuiltFunction += '          success: false,\n';
    rebuiltFunction += '          error: `Unknown tool: ${toolName}`,\n';
    rebuiltFunction += '          availableTools: [\'get_ad_accounts\', \'get_campaigns\', \'create_campaign\', \'get_campaign_details\']\n';
    rebuiltFunction += '        };\n';
  } else {
    // Make sure each case is properly indented
    caseObj.lines.forEach((line, lineIndex) => {
      if (lineIndex === 0) {
        rebuiltFunction += '      ' + line.trim() + '\n';
      } else {
        // Preserve relative indentation
        rebuiltFunction += line + '\n';
      }
    });
    
    // Add spacing between cases
    if (index < cases.length - 1) {
      rebuiltFunction += '\n';
    }
  }
});

// Close the switch and try-catch
rebuiltFunction += '    }\n';  // Close switch
rebuiltFunction += '  } catch (error) {\n';
rebuiltFunction += '    return {\n';
rebuiltFunction += '      success: false,\n';
rebuiltFunction += '      error: `Tool execution failed: ${error instanceof Error ? error.message : \'Unknown error\'}`,\n';
rebuiltFunction += '      tool: toolName\n';
rebuiltFunction += '    };\n';
rebuiltFunction += '  }\n';
rebuiltFunction += '}\n';

// Find where the old function ends and get everything after
let afterFunctionIndex = content.indexOf('\napp.use((err: Error', functionStart);
if (afterFunctionIndex === -1) {
  // Try another pattern
  afterFunctionIndex = content.indexOf('\n// Serve test page', functionStart);
}
if (afterFunctionIndex === -1) {
  // Try to find the error handler
  afterFunctionIndex = content.indexOf('\napp.get(\'/\'', functionStart);
}

const afterFunction = afterFunctionIndex > -1 ? content.substring(afterFunctionIndex) : '';

// Combine everything
const fixedContent = beforeFunction + rebuiltFunction + afterFunction;

// Write the fixed content
fs.writeFileSync(filePath, fixedContent);
console.log('\n✅ Manually rebuilt processMcpToolCall function with proper structure');

// Verify
console.log('\n🔍 Verifying TypeScript compilation...');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit src/http-server.ts', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.log('⚠️  TypeScript compilation still has issues');
  const output = error.stdout?.toString() || error.message;
  const errorLines = output.split('\n').slice(0, 10);
  errorLines.forEach(line => console.log(line));
  console.log('...');
}
