/**
 * SIMPLE TEST SERVER
 * If Railway is stuck, this minimal server might work
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ 
    status: 'WORKING', 
    message: 'Railway deployment successful!',
    timestamp: new Date().toISOString(),
    commit: '9f0f45f'
  });
});

app.get('/health', (req, res) => {
  res.json({ health: 'OK' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
