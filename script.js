// FDS IAM Bearer Token Tester Script

class BearerTokenTester {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.testCounter = 0;
    }

    initializeElements() {
        this.testEndpoint = document.getElementById('testEndpoint');
        this.requestMethod = document.getElementById('requestMethod');
        this.manualToken = document.getElementById('manualToken');
        this.testButton = document.getElementById('testRequest');
        this.clearButton = document.getElementById('clearResults');
        this.requestDetails = document.getElementById('requestDetails');
        this.responseDetails = document.getElementById('responseDetails');
        this.tokenDetails = document.getElementById('tokenDetails');
    }

    attachEventListeners() {
        this.testButton.addEventListener('click', () => this.performTest());
        this.clearButton.addEventListener('click', () => this.clearResults());
    }

    async performTest() {
        this.testCounter++;
        const timestamp = new Date().toISOString();
        
        this.setLoading(true);
        this.updateRequestInfo(timestamp);

        try {
            const response = await this.makeTestRequest();
            this.handleResponse(response, timestamp);
        } catch (error) {
            this.handleError(error, timestamp);
        } finally {
            this.setLoading(false);
        }
    }

    async makeTestRequest() {
        const url = this.testEndpoint.value.trim();
        const method = this.requestMethod.value;
        const manualToken = this.manualToken.value.trim();

        if (!url) {
            throw new Error('Please enter a test endpoint URL');
        }

        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'X-Test-Source': 'FDS-IAM-Tester',
            'X-Test-Timestamp': new Date().toISOString(),
            'X-Test-Counter': this.testCounter.toString()
        };

        // Add manual token if provided
        if (manualToken) {
            headers['Authorization'] = `Bearer ${manualToken}`;
        }

        const requestOptions = {
            method: method,
            headers: headers,
            mode: 'cors'
        };

        // Add body for POST/PUT requests
        if (method === 'POST' || method === 'PUT') {
            requestOptions.body = JSON.stringify({
                test: true,
                message: 'FDS IAM Bearer Token Test',
                timestamp: new Date().toISOString()
            });
        }

        return await fetch(url, requestOptions);
    }

    updateRequestInfo(timestamp) {
        const url = this.testEndpoint.value.trim();
        const method = this.requestMethod.value;
        const manualToken = this.manualToken.value.trim();

        const requestInfo = {
            timestamp: timestamp,
            testNumber: this.testCounter,
            method: method,
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'X-Test-Source': 'FDS-IAM-Tester',
                'X-Test-Timestamp': timestamp,
                'X-Test-Counter': this.testCounter.toString()
            },
            manualTokenProvided: !!manualToken,
            manualToken: manualToken ? this.maskToken(manualToken) : 'None',
            expectedBehavior: 'FDS Gateway should inject Authorization: Bearer <JWT> header'
        };

        if (manualToken) {
            requestInfo.headers['Authorization'] = `Bearer ${this.maskToken(manualToken)}`;
        }

        this.requestDetails.textContent = JSON.stringify(requestInfo, null, 2);
        this.requestDetails.className = '';
    }

    async handleResponse(response, timestamp) {
        const responseData = {
            timestamp: timestamp,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: {},
            url: response.url
        };

        // Capture response headers
        for (let [key, value] of response.headers) {
            responseData.headers[key] = value;
        }

        try {
            const responseBody = await response.text();
            let parsedBody;
            
            try {
                parsedBody = JSON.parse(responseBody);
            } catch {
                parsedBody = responseBody;
            }

            responseData.body = parsedBody;
            
            this.responseDetails.textContent = JSON.stringify(responseData, null, 2);
            this.responseDetails.className = response.ok ? 'success' : 'error';

            // Analyze the token
            this.analyzeBearerToken(parsedBody, timestamp);

        } catch (error) {
            responseData.error = `Failed to parse response: ${error.message}`;
            this.responseDetails.textContent = JSON.stringify(responseData, null, 2);
            this.responseDetails.className = 'error';
        }
    }

    analyzeBearerToken(responseBody, timestamp) {
        const analysis = {
            timestamp: timestamp,
            tokenFound: false,
            tokenSource: 'Unknown',
            tokenDetails: {}
        };

        try {
            // Check if response contains headers information (like from httpbin.org)
            if (responseBody && typeof responseBody === 'object') {
                let authHeader = null;
                
                // Look for Authorization header in different possible locations
                if (responseBody.headers && responseBody.headers.Authorization) {
                    authHeader = responseBody.headers.Authorization;
                    analysis.tokenSource = 'FDS Gateway (Auto-injected)';
                } else if (responseBody.headers && responseBody.headers.authorization) {
                    authHeader = responseBody.headers.authorization;
                    analysis.tokenSource = 'FDS Gateway (Auto-injected)';
                } else if (this.manualToken.value.trim()) {
                    analysis.tokenSource = 'Manual Token (Test)';
                    analysis.manualTokenUsed = true;
                }

                if (authHeader && authHeader.startsWith('Bearer ')) {
                    analysis.tokenFound = true;
                    const token = authHeader.substring(7); // Remove "Bearer "
                    
                    analysis.tokenDetails = {
                        fullHeader: authHeader,
                        tokenPreview: this.maskToken(token),
                        tokenLength: token.length,
                        isJWT: this.isJWT(token),
                        jwtParts: this.isJWT(token) ? this.analyzeJWT(token) : null
                    };
                } else {
                    analysis.message = 'No Bearer token found in Authorization header';
                    if (this.manualToken.value.trim()) {
                        analysis.warning = 'Manual token was provided but not seen in response. Check if endpoint echoes headers.';
                    } else {
                        analysis.warning = 'FDS Gateway may not be active or may not be injecting tokens for this endpoint.';
                    }
                }
            } else {
                analysis.message = 'Response format does not show headers. Try using httpbin.org/headers to see all headers.';
            }

        } catch (error) {
            analysis.error = `Token analysis failed: ${error.message}`;
        }

        this.tokenDetails.textContent = JSON.stringify(analysis, null, 2);
        
        if (analysis.tokenFound) {
            this.tokenDetails.className = 'success';
        } else if (analysis.warning) {
            this.tokenDetails.className = 'warning';
        } else {
            this.tokenDetails.className = 'error';
        }
    }

    handleError(error, timestamp) {
        const errorInfo = {
            timestamp: timestamp,
            error: error.message,
            type: error.name,
            details: 'This could be due to CORS issues, network problems, or invalid URL'
        };

        this.responseDetails.textContent = JSON.stringify(errorInfo, null, 2);
        this.responseDetails.className = 'error';

        const tokenAnalysis = {
            timestamp: timestamp,
            status: 'Request Failed',
            message: 'Cannot analyze token because the request failed',
            possibleCauses: [
                'CORS policy blocking the request',
                'Network connectivity issues', 
                'Invalid endpoint URL',
                'FDS Gateway configuration issues'
            ]
        };

        this.tokenDetails.textContent = JSON.stringify(tokenAnalysis, null, 2);
        this.tokenDetails.className = 'error';
    }

    maskToken(token) {
        if (!token || token.length < 10) return token;
        const start = token.substring(0, 6);
        const end = token.substring(token.length - 4);
        const middle = '*'.repeat(Math.min(20, token.length - 10));
        return `${start}${middle}${end}`;
    }

    isJWT(token) {
        return token.split('.').length === 3;
    }

    analyzeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            return {
                header: header,
                payload: {
                    ...payload,
                    // Mask sensitive information but keep structure
                    sub: payload.sub ? this.maskToken(payload.sub) : undefined,
                    email: payload.email ? this.maskEmail(payload.email) : undefined
                },
                signature: this.maskToken(parts[2])
            };
        } catch (error) {
            return { error: 'Failed to parse JWT: ' + error.message };
        }
    }

    maskEmail(email) {
        if (!email || !email.includes('@')) return email;
        const [user, domain] = email.split('@');
        const maskedUser = user.length > 2 ? user[0] + '*'.repeat(user.length - 2) + user[user.length - 1] : user;
        return `${maskedUser}@${domain}`;
    }

    setLoading(loading) {
        if (loading) {
            this.testButton.disabled = true;
            this.testButton.textContent = '🔄 Testing...';
            this.testButton.classList.add('loading');
        } else {
            this.testButton.disabled = false;
            this.testButton.textContent = '🚀 Send Test Request';
            this.testButton.classList.remove('loading');
        }
    }

    clearResults() {
        this.requestDetails.textContent = 'No test performed yet. Click "Send Test Request" to start.';
        this.requestDetails.className = '';
        
        this.responseDetails.textContent = 'No response data available.';
        this.responseDetails.className = '';
        
        this.tokenDetails.textContent = 'No token analysis available.';
        this.tokenDetails.className = '';
        
        this.testCounter = 0;
    }
}

// Initialize the tester when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BearerTokenTester();
    
    // Add some helpful information on page load
    console.log('FDS IAM Bearer Token Tester loaded');
    console.log('This tool helps test if Bearer tokens are being injected by the FDS Gateway');
    console.log('Use httpbin.org/headers to see all request headers including Authorization header');
});

// Add some utility functions for debugging
window.FDSTest = {
    getCurrentHeaders: () => {
        return fetch('https://httpbin.org/headers')
            .then(response => response.json())
            .then(data => {
                console.log('Current request headers:', data.headers);
                return data.headers;
            })
            .catch(error => {
                console.error('Failed to get headers:', error);
                return null;
            });
    },
    
    testCurrentLocation: () => {
        console.log('Current location:', window.location.href);
        console.log('Base href:', document.querySelector('base')?.href || 'Not set');
        console.log('Is HTTPS:', window.location.protocol === 'https:');
    }
};
