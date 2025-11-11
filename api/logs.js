// Vercel Serverless API - Store and retrieve logs
// Using in-memory storage (will reset on cold starts)
// For production, use a database like MongoDB, PostgreSQL, or Redis

let logs = [];
const MAX_LOGS = 500;

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return all logs
    res.status(200).json({
      success: true,
      logs: logs,
      total: logs.length
    });
  } else if (req.method === 'POST') {
    // Add new log
    try {
      const logEntry = {
        ...req.body,
        serverTimestamp: new Date().toISOString(),
        clientIp: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
      };

      logs.unshift(logEntry);

      // Keep only last MAX_LOGS
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(0, MAX_LOGS);
      }

      res.status(200).json({
        success: true,
        log: logEntry,
        total: logs.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
