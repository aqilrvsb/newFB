// Debug Facebook Scheduling Issues - Malaysia Timezone Fix

const fs = require('fs');

// Current time debugging for Malaysia (UTC+8)
const now = new Date();
const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for Malaysia
const futureTime = new Date(malaysiaTime.getTime() + (30 * 60 * 1000)); // Add 30 minutes

console.log('🇲🇾 MALAYSIA TIMEZONE DEBUGGING:');
console.log('=====================================');
console.log('Current UTC Time:', now.toISOString());
console.log('Current Malaysia Time:', malaysiaTime.toISOString());
console.log('Future Schedule Time (+30min):', futureTime.toISOString());
console.log('');

// Unix timestamps
const currentUnix = Math.floor(now.getTime() / 1000);
const malaysiaUnix = Math.floor(malaysiaTime.getTime() / 1000);
const futureUnix = Math.floor(futureTime.getTime() / 1000);

console.log('📅 UNIX TIMESTAMPS:');
console.log('=====================================');
console.log('Current Unix:', currentUnix);
console.log('Malaysia Unix:', malaysiaUnix);
console.log('Future Unix (+30min):', futureUnix);
console.log('');

// Test multiple future timestamps
const test1 = futureUnix;
const test2 = currentUnix + (60 * 60); // +1 hour
const test3 = currentUnix + (2 * 60 * 60); // +2 hours
const test4 = currentUnix + (24 * 60 * 60); // +1 day

console.log('🧪 TEST TIMESTAMPS TO TRY:');
console.log('=====================================');
console.log('Test 1 (+30min):', test1, '→', new Date(test1 * 1000).toISOString());
console.log('Test 2 (+1 hour):', test2, '→', new Date(test2 * 1000).toISOString());
console.log('Test 3 (+2 hours):', test3, '→', new Date(test3 * 1000).toISOString());
console.log('Test 4 (+1 day):', test4, '→', new Date(test4 * 1000).toISOString());
console.log('');

// ISO format alternatives
console.log('📝 ISO FORMAT ALTERNATIVES:');
console.log('=====================================');
console.log('ISO UTC:', futureTime.toISOString());
console.log('ISO Malaysia (+08:00):', futureTime.toISOString().replace('Z', '+08:00'));
console.log('ISO No Z:', futureTime.toISOString().replace('Z', ''));
console.log('');

// Facebook specific formats to try
console.log('🔧 FACEBOOK SPECIFIC FORMATS:');
console.log('=====================================');
console.log('Unix Timestamp:', test2);
console.log('ISO with +08:00:', futureTime.toISOString().replace('Z', '+08:00'));
console.log('ISO UTC:', futureTime.toISOString());
console.log('');

console.log('✅ RECOMMENDED TEST VALUES:');
console.log('=====================================');
console.log('Try scheduledTime:', test2, '(+1 hour from now)');
console.log('Try scheduledTime:', test3, '(+2 hours from now)');
console.log('Try scheduledTime:', `"${futureTime.toISOString()}"`, '(ISO UTC)');
