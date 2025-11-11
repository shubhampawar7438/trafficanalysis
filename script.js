// Universal Traffic Monitor with WebSocket
class TrafficMonitor {
    constructor() {
        this.ws = null;
        this.sessionId = this.generateSessionId();
        this.logsContainer = document.getElementById('logs');
        this.totalLogs = 0;
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.trackPageVisit();
        this.setupEventListeners();
    }

    generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.addSystemLog('Connecting to ' + wsUrl);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.addSystemLog('Connected to server');
            document.getElementById('status').textContent = 'ONLINE';
            document.getElementById('status').style.color = '#0f0';
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'init') {
                this.addSystemLog(`Loaded ${data.logs.length} existing logs`);
                data.logs.forEach(log => this.displayLog(log));
                this.updateStats(data.totalClients, data.logs.length);
            } else if (data.type === 'newLog') {
                this.displayLog(data.log);
                this.totalLogs++;
                document.getElementById('totalLogs').textContent = this.totalLogs;
            } else if (data.type === 'clientCount') {
                document.getElementById('connected').textContent = data.count;
            }
        };

        this.ws.onerror = (error) => {
            this.addSystemLog('WebSocket error', 'error');
            document.getElementById('status').textContent = 'ERROR';
            document.getElementById('status').style.color = '#f00';
        };

        this.ws.onclose = () => {
            this.addSystemLog('Disconnected from server', 'error');
            document.getElementById('status').textContent = 'OFFLINE';
            document.getElementById('status').style.color = '#f00';
            
            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                this.addSystemLog('Attempting to reconnect...');
                this.connectWebSocket();
            }, 3000);
        };
    }

    sendLog(type, details) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const log = {
                type: type,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                browser: this.getBrowserInfo(),
                os: this.getOSInfo(),
                details: details
            };
            
            this.ws.send(JSON.stringify({
                type: 'log',
                log: log
            }));
        }
    }

    trackPageVisit() {
        this.sendLog('visit', {
            url: window.location.href,
            referrer: document.referrer || 'direct'
        });
    }

    setupEventListeners() {
        // Track clicks (throttled)
        let lastClick = 0;
        document.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - lastClick > 500) { // Throttle to max 2 clicks per second
                lastClick = now;
                this.sendLog('click', {
                    element: e.target.tagName,
                    text: e.target.innerText?.substring(0, 30) || 'N/A'
                });
            }
        });

        // Track scrolling (throttled)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
                this.sendLog('scroll', {
                    percent: scrollPercent + '%'
                });
            }, 2000);
        });

        // Track page exit
        window.addEventListener('beforeunload', () => {
            this.sendLog('visit', { action: 'exit' });
        });
    }

    displayLog(log) {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const ip = log.clientIp || 'unknown';
        const session = log.sessionId.substring(0, 6);
        
        let logClass = 'log-visit';
        if (log.type === 'click') logClass = 'log-click';
        if (log.type === 'scroll') logClass = 'log-scroll';
        
        let detailsStr = '';
        if (log.details) {
            detailsStr = Object.entries(log.details)
                .map(([k, v]) => `${k}=${v}`)
                .join(' ');
        }
        
        const logLine = document.createElement('div');
        logLine.className = 'log-line ' + logClass;
        logLine.innerHTML = `<span class="timestamp">[${time}]</span> <span class="ip">${ip}</span> session=<span class="session-id">${session}</span> type=${log.type.toUpperCase()} browser=${log.browser} os=${log.os} ${detailsStr}`;
        
        this.logsContainer.appendChild(logLine);
        
        // Auto-scroll to bottom
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
        
        // Keep only last 200 log lines in DOM
        while (this.logsContainer.children.length > 200) {
            this.logsContainer.removeChild(this.logsContainer.firstChild);
        }
    }

    addSystemLog(message, type = 'info') {
        const logLine = document.createElement('div');
        logLine.className = 'log-line';
        if (type === 'error') {
            logLine.className += ' log-error';
        }
        logLine.textContent = `[SYSTEM] ${message}`;
        this.logsContainer.appendChild(logLine);
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }

    updateStats(connected, totalLogs) {
        document.getElementById('connected').textContent = connected;
        document.getElementById('totalLogs').textContent = totalLogs;
        this.totalLogs = totalLogs;
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edg')) return 'Edge';
        return 'Unknown';
    }

    getOSInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Win')) return 'Windows';
        if (ua.includes('Mac')) return 'MacOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.trafficMonitor = new TrafficMonitor();
});
