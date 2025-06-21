const fs = require('fs');

// Fix TypeScript errors in ads-library-tools.ts
const filePath = 'src/tools/ads-library-tools.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix both occurrences of encodeURIComponent
content = content.replace(
  /encodeURIComponent\(value\)/g,
  'encodeURIComponent(String(value))'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed TypeScript errors in ads-library-tools.ts');
