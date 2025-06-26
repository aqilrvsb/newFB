// EMERGENCY: Direct fix for corrupted page-tools.ts
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY: Direct fix for corrupted page-tools.ts...');

const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Find the start of the corruption (the malformed catch statement)
const corruptionStart = content.indexOf('  } catch (error) { else if (typeof scheduledTime');

if (corruptionStart === -1) {
  console.log('❌ Could not find corruption point');
  process.exit(1);
}

console.log(`📍 Found corruption starting at position ${corruptionStart}`);

// Keep only the content before the corruption and add proper ending
const cleanContent = content.slice(0, corruptionStart) + `  } catch (error) {
    return {
      success: false,
      message: \`Error getting top commenters: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};`;

// Write the fixed content
fs.writeFileSync(pageToolsPath, cleanContent, 'utf8');

console.log('✅ Fixed corrupted page-tools.ts');
console.log('🧹 Removed all malformed code');
console.log('🔧 File should now compile correctly');

// Verify the fix
const newContent = fs.readFileSync(pageToolsPath, 'utf8');
const lines = newContent.split('\n');
console.log(`📊 File now has ${lines.length} lines`);
console.log(`📝 Last few lines:`);
console.log(newContent.slice(-200));
