// Update session with new Facebook token
const https = require('https');

const USER_ID = 'a35f6da4-1c60-4547-920c-946df589afeb';
const BASE_URL = 'newfb-production.up.railway.app';
const FB_ACCESS_TOKEN = 'EAA8rmujqwMwBO5uxGZCS7DhTAtZAuVI1G1v3WU8kYdndU94wLO7VTY9hnsB79H7JBudImC96ZAHMWZAZBE4KXgPDx2YdSk0DQi40A2r7pcswH9qO1TMAipXm3ArstIxgghzQ8uLbZBb6YFcWX89c5Ea89avLIloV9fCw04zfGFGbIZBb3IDzzIUeZBDVzRqPtESA';

console.log('Updating session with new Facebook token...\n');

// First, let's check what ad accounts you have
function listYourAdAccounts() {
  console.log('Your Facebook Ad Accounts:\n');
  
  const accounts = [
    'act_1308496443855315',
    'act_3690666387860684', 
    'act_1144995856698089',
    'act_2003606943382227',
    'act_1257831565368468',
    'act_1210963320276816'
  ];
  
  console.log('You have access to 6 ad accounts:');
  accounts.forEach((acc, idx) => {
    console.log(`${idx + 1}. ${acc}`);
  });
  
  console.log('\nYou may need to:');
  console.log('1. Re-authenticate at https://newfb-production.up.railway.app/');
  console.log('2. Make sure to grant all permissions when Facebook asks');
  console.log('3. After authentication, the server will have your new token');
  console.log('\nThe ads you\'re trying to access (120219408501250312, 120219408558020312)');
  console.log('might belong to one of these accounts or a different account.');
}

listYourAdAccounts();