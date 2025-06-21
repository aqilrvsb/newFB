const fs = require('fs');

// Update README.md
let readme = fs.readFileSync('README.md', 'utf8');
readme = readme.replace(
  'Sessions auto-expire after 1 hour of inactivity',
  'Sessions persist indefinitely (no expiration)'
);
readme = readme.replace(
  'Automatic cleanup every 10 minutes',
  'Automatic cleanup disabled by default (SESSION_TIMEOUT=0)'
);
fs.writeFileSync('README.md', readme);

console.log('✅ Updated README.md to reflect no session expiration');
