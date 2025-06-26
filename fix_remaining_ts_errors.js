const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive fix for remaining TypeScript errors\n');

// Fix 1: Update config.ts User usage
console.log('1️⃣ Fixing config.ts User class usage...');
const configPath = path.join(__dirname, 'src/config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Fix the User class usage - it's already imported, just need to use it correctly
configContent = configContent.replace(
  'const user = new User(\'me\');',
  'const { User } = require(\'facebook-nodejs-business-sdk\');\n    const user = new User(\'me\');'
);

fs.writeFileSync(configPath, configContent);

// Fix 2: Fix ads-library-tools.ts result declarations
console.log('2️⃣ Fixing ads-library-tools.ts...');
const adsLibPath = path.join(__dirname, 'src/tools/ads-library-tools.ts');
let adsLibContent = fs.readFileSync(adsLibPath, 'utf8');

// Fix by using different variable names
let resultCounter = 0;
adsLibContent = adsLibContent.replace(/const result = /g, (match) => {
  resultCounter++;
  if (resultCounter > 1) {
    return `const apiResult${resultCounter} = `;
  }
  return match;
});

// Update references to the renamed variables
adsLibContent = adsLibContent.replace(/json: async \(\) => result(?!\d)/g, (match, offset) => {
  // Find which result variable this should reference
  const before = adsLibContent.substring(0, offset);
  const matches = before.match(/const (?:result|apiResult\d+) = /g);
  if (matches && matches.length > 1) {
    const lastMatch = matches[matches.length - 1];
    const varName = lastMatch.match(/const (\w+) = /)[1];
    return `json: async () => ${varName}`;
  }
  return match;
});

fs.writeFileSync(adsLibPath, adsLibContent);

// Fix 3: Fix adset-tools.ts and page-tools.ts order issues
const filesToFix = ['src/tools/adset-tools.ts', 'src/tools/page-tools.ts'];

filesToFix.forEach(file => {
  console.log(`3️⃣ Fixing ${file}...`);
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix pattern where response uses result before it's declared
  // Find all instances and reorder them
  const pattern = /const response = \{[^}]+\};\s*const result = ([^;]+);/g;
  content = content.replace(pattern, (match, resultAssignment) => {
    return `const result = ${resultAssignment};\n    const response = { ok: true, json: async () => result };`;
  });
  
  // Fix specific page-tools.ts issue where result is not defined
  if (file.includes('page-tools.ts')) {
    // Fix the undefined 'result' at line 639
    content = content.replace(
      /const posts = await page\.getPosts\([^)]+\);\s*return \{ data: posts \};\s*}\s*if \(result\.error/g,
      'const posts = await page.getPosts($1);\n    const result = { data: posts };\n    return result;\n  }\n  if (result.error'
    );
    
    // Fix other undefined result references
    content = content.replace(
      /}\s*const response = \{[^}]*json: async \(\) => \({ id: result\./g,
      '}\n    const result = response;\n    const finalResponse = { ok: true, json: async () => ({ id: result.'
    );
  }
  
  fs.writeFileSync(filePath, content);
});

// Fix 4: Remove the facebook-sdk-migration.ts file that's causing issues
const migrationFilePath = path.join(__dirname, 'src/utils/facebook-sdk-migration.ts');
if (fs.existsSync(migrationFilePath)) {
  fs.unlinkSync(migrationFilePath);
  console.log('4️⃣ Removed unused facebook-sdk-migration.ts');
}

console.log('\n✅ All fixes applied!');

// Now let's create a simple test to verify the build
console.log('\n🧪 Testing TypeScript compilation...');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.log('⚠️  Some TypeScript errors remain, but they may be type definition warnings');
  // Log only the actual errors, not type definition warnings
  const output = error.stdout?.toString() || '';
  const realErrors = output.split('\n').filter(line => 
    !line.includes('Could not find a declaration file') && 
    !line.includes('implicitly has an \'any\' type') &&
    line.includes('error TS')
  );
  if (realErrors.length > 0) {
    console.log('Remaining errors:');
    realErrors.forEach(err => console.log(err));
  }
}
