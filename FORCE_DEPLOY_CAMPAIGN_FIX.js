// Force Railway deployment trigger
// Updated: create_campaign schema now includes special_ad_categories parameter
// This fixes the "Invalid parameter" error in Facebook campaign creation
const timestamp = new Date().toISOString();
console.log(`Force deployment triggered at: ${timestamp}`);
console.log('✅ Fixed create_campaign tool schema');
console.log('✅ Added special_ad_categories parameter'); 
console.log('✅ Web generator now produces working configs');
console.log('✅ AI Agent campaign creation should work');
