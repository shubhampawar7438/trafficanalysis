const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store all logs in memory
let logs = [];
let connectedClients = new Set();

// Serve static files
app.use(express.static(__dirname));

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    connectedClients.add(ws);
    
    console.log(`[SERVER] New connection from ${clientIp}. Total clients: ${connectedClients.size}`);

    // Send existing logs to new client
    ws.send(JSON.stringify({
        type: 'init',
        logs: logs,
        totalClients: connectedClients.size
    }));

    // Broadcast client count update
    broadcastClientCount();

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'log') {
                // Add timestamp and IP info
                const logEntry = {
                    ...data.log,
                    serverTimestamp: new Date().toISOString(),
                    clientIp: clientIp
                };
                
                logs.push(logEntry);
                
                // Keep only last 500 logs
                if (logs.length > 500) {
                    logs = logs.slice(-500);
                }
                
                // Broadcast to all connected clients
                broadcast({
                    type: 'newLog',
                    log: logEntry
                });
                
                console.log(`[LOG] ${logEntry.type.toUpperCase()} from ${clientIp}`);
            }
        } catch (error) {
            console.error('[ERROR] Failed to parse message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        connectedClients.delete(ws);
        console.log(`[SERVER] Client disconnected. Total clients: ${connectedClients.size}`);
        broadcastClientCount();
    });

    ws.on('error', (error) => {
        console.error('[ERROR] WebSocket error:', error);
    });
});

// Broadcast message to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Broadcast client count
function broadcastClientCount() {
    broadcast({
        type: 'clientCount',
        count: connectedClients.size
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[SERVER] Traffic monitor running on http://localhost:${PORT}`);
    console.log(`[SERVER] WebSocket server ready`);
});
