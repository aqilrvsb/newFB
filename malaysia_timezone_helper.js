// Malaysia Timezone Helper Utility for Facebook MCP
// Provides easy functions to calculate proper timestamps for Malaysia (UTC+8)

/**
 * Get Malaysia timestamp for scheduling posts
 * @param {number} hoursFromNow - Hours from current time (minimum 0.17 = 10 minutes)
 * @returns {object} - Contains timestamp and readable dates
 */
function getMalaysiaScheduleTime(hoursFromNow = 1) {
  const now = new Date();
  const malaysiaOffset = 8 * 60 * 60 * 1000; // UTC+8 in milliseconds
  
  // Current time in Malaysia
  const malaysiaTime = new Date(now.getTime() + malaysiaOffset);
  
  // Future time in Malaysia
  const futureTime = new Date(malaysiaTime.getTime() + (hoursFromNow * 60 * 60 * 1000));
  
  // Convert to Unix timestamp (seconds)
  const timestamp = Math.floor(futureTime.getTime() / 1000);
  
  return {
    timestamp: timestamp,
    utcTime: futureTime.toISOString(),
    malaysiaTime: futureTime.toLocaleString('en-MY', { 
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    readableTime: futureTime.toLocaleString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  };
}

/**
 * Validate if a timestamp is valid for Facebook scheduling
 * @param {number} timestamp - Unix timestamp to validate
 * @returns {object} - Validation result
 */
function validateScheduleTimestamp(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const minTime = now + (10 * 60); // 10 minutes from now
  const maxTime = now + (6 * 30 * 24 * 60 * 60); // 6 months from now
  
  const isValid = timestamp >= minTime && timestamp <= maxTime;
  
  return {
    isValid,
    timestamp,
    readable: new Date(timestamp * 1000).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
    errors: isValid ? [] : [
      timestamp < minTime ? 'Must be at least 10 minutes in the future' : null,
      timestamp > maxTime ? 'Cannot be more than 6 months in the future' : null
    ].filter(Boolean)
  };
}

// Example usage:
console.log('🇲🇾 MALAYSIA SCHEDULING HELPER');
console.log('================================');

// Schedule for different times
const examples = [
  { label: '30 minutes from now', hours: 0.5 },
  { label: '1 hour from now', hours: 1 },
  { label: '2 hours from now', hours: 2 },
  { label: '1 day from now', hours: 24 },
  { label: '1 week from now', hours: 24 * 7 }
];

examples.forEach(example => {
  const schedule = getMalaysiaScheduleTime(example.hours);
  console.log(`\n📅 ${example.label}:`);
  console.log(`   Timestamp: ${schedule.timestamp}`);
  console.log(`   Malaysia Time: ${schedule.malaysiaTime}`);
  console.log(`   Readable: ${schedule.readableTime}`);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMalaysiaScheduleTime,
    validateScheduleTimestamp
  };
}

console.log('\n✅ Malaysia timezone helper ready!');
console.log('📝 Use getMalaysiaScheduleTime(hours) to get proper timestamps');
