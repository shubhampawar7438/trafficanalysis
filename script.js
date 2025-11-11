// Universal Traffic Monitor with HTTP Polling (Vercel Compatible)
class TrafficMonitor {
    constructor() {
        this.apiUrl = '/api/logs';
        this.sessionId = this.generateSessionId();
        this.logsContainer = document.getElementById('logs');
        this.totalLogs = 0;
        this.lastLogId = null;
        this.pollingInterval = null;
        this.init();
    }

    init() {
        this.loadExistingLogs();
        this.trackPageVisit();
        this.setupEventListeners();
        this.startPolling();
    }

    generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async loadExistingLogs() {
        try {
            this.addSystemLog('Loading existing logs...');
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.addSystemLog(`Loaded ${data.logs.length} existing logs`);
                data.logs.reverse().forEach(log => this.displayLog(log, false));
                this.totalLogs = data.total;
                document.getElementById('totalLogs').textContent = this.totalLogs;
                document.getElementById('status').textContent = 'ONLINE';
                document.getElementById('status').style.color = '#0f0';
            }
        } catch (error) {
            this.addSystemLog('Error loading logs: ' + error.message, 'error');
            document.getElementById('status').textContent = 'ERROR';
            document.getElementById('status').style.color = '#f00';
        }
    }

    startPolling() {
        // Poll for new logs every 2 seconds
        this.pollingInterval = setInterval(() => {
            this.checkForNewLogs();
        }, 2000);
    }

    async checkForNewLogs() {
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.success && data.logs.length > 0) {
                const currentTotal = data.total;
                if (currentTotal > this.totalLogs) {
                    // New logs available
                    const newLogsCount = currentTotal - this.totalLogs;
                    const newLogs = data.logs.slice(0, newLogsCount);
                    
                    newLogs.reverse().forEach(log => this.displayLog(log, true));
                    this.totalLogs = currentTotal;
                    document.getElementById('totalLogs').textContent = this.totalLogs;
                }
            }
        } catch (error) {
            // Silently fail polling errors
        }
    }

    async sendLog(type, details) {
        try {
            const log = {
                type: type,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                browser: this.getBrowserInfo(),
                os: this.getOSInfo(),
                details: details
            };
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(log)
            });
            
            const data = await response.json();
            if (data.success) {
                // Log sent successfully
                document.getElementById('status').textContent = 'ONLINE';
                document.getElementById('status').style.color = '#0f0';
            }
        } catch (error) {
            document.getElementById('status').textContent = 'ERROR';
            document.getElementById('status').style.color = '#f00';
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

    displayLog(log, isNew = false) {
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
        
        if (isNew) {
            // Add new logs at the end
            this.logsContainer.appendChild(logLine);
        } else {
            // Add existing logs at the end
            this.logsContainer.appendChild(logLine);
        }
        
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
        document.getElementById('connected').textContent = connected || 'N/A';
        document.getElementById('totalLogs').textContent = totalLogs;
        this.totalLogs = totalLogs;
    }
    
    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
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
