const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing import statements - removing .js extensions\n');

const files = [
  'src/http-server.ts',
  'src/tools/account-insights-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/page-tools.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the import statements - remove .js extension
  content = content.replace(
    /import { sdkFetch } from ['"]\.\.\/utils\/facebook-sdk-wrapper\.js['"]/g,
    "import { sdkFetch } from '../utils/facebook-sdk-wrapper'"
  );
  
  content = content.replace(
    /import { sdkFetch } from ['"]\.\.\/\.\.\/utils\/facebook-sdk-wrapper\.js['"]/g,
    "import { sdkFetch } from '../../utils/facebook-sdk-wrapper'"
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed imports in ${file}`);
});

console.log('\n✅ All import statements fixed!');
