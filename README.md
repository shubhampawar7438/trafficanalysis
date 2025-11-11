# Universal Traffic Monitor - Real-Time System Logs

A simple real-time traffic monitoring system that displays ALL user activity across ALL visitors in a terminal-style interface. Every user sees the same logs from everyone in real-time.

## Features

- **Universal Logging**: ALL users see logs from EVERY visitor in real-time
- **WebSocket Real-Time Sync**: Instant log updates across all connected clients
- **System-Style UI**: Minimal terminal/console-like interface (black background, green text)
- **Activity Tracking**: 
  - Page visits
  - Click events
  - Scroll events
  - User exits
- **User Information**: IP address, session ID, browser, OS, and activity details
- **Live Statistics**: Connected users count, total logs, connection status

## How It Works

1. **Server-Based**: Uses Node.js + Express + WebSocket for universal log sharing
2. **Real-Time Sync**: When ANY user performs an action, ALL connected users see it instantly
3. **Shared State**: All logs are stored on the server and broadcast to everyone
4. **Auto-Reconnect**: If connection drops, automatically attempts to reconnect

## Installation

1. Install Node.js (if not already installed)
2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and go to:
```
http://localhost:3000
```

3. Open the same URL in multiple browsers/tabs to see real-time log sharing!

## What You'll See

Logs appear in terminal style format:
```
[TIME] IP_ADDRESS session=SESSION_ID type=VISIT browser=Chrome os=Windows url=http://localhost:3000 referrer=direct
[TIME] IP_ADDRESS session=SESSION_ID type=CLICK browser=Firefox os=MacOS element=DIV text=Some text
[TIME] IP_ADDRESS session=SESSION_ID type=SCROLL browser=Edge os=Windows percent=45%
```

## Technical Details

- **Backend**: Node.js, Express, WebSocket (ws library)
- **Frontend**: Vanilla JavaScript, inline CSS
- **Storage**: In-memory (server RAM) - keeps last 500 logs
- **Protocol**: WebSocket for bidirectional real-time communication
- **Port**: 3000 (configurable via PORT environment variable)

## File Structure

```
├── server.js       # Node.js WebSocket server
├── index.html      # Frontend with system-log UI
├── script.js       # WebSocket client and tracking logic
├── package.json    # Node.js dependencies
└── README.md       # This file
```

## Deployment

For production deployment:

1. **Heroku/Railway/Render**: 
   - Push to Git
   - Set PORT environment variable
   - Deploy

2. **VPS (DigitalOcean, AWS, etc.)**:
   ```bash
   npm install
   npm start
   ```
   - Use PM2 or similar for process management
   - Configure reverse proxy (nginx) if needed

## Privacy & Security Note

⚠️ **WARNING**: This is a demonstration project. 
- All activity is publicly visible to everyone
- IP addresses are logged and displayed
- No authentication or access control
- Not suitable for production with sensitive data
- Use for educational/demo purposes only

## Browser Compatibility

Works on all modern browsers with WebSocket support:
- Chrome/Edge
- Firefox
- Safari
- Opera

## License

MIT - Free to use and modify
