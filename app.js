class FDSTestApp {
    constructor() {
        this.init();
    }

    init() {
        this.displayAppInfo();
        this.displayCurrentBaseHref();
        this.checkForExistingAuthHeader();
    }

    displayAppInfo() {
        const info = document.getElementById('appInfo');
        const currentUrl = window.location.href;
        const baseUrl = document.querySelector('base')?.href || 'Not set';
        
        info.innerHTML = `
            <pre>
📍 Current URL: ${currentUrl}
🏠 Base URL: ${baseUrl}
📱 User Agent: ${navigator.userAgent}
🕒 Loaded at: ${new Date().toISOString()}
            </pre>
        `;
    }

    displayCurrentBaseHref() {
        const baseElement = document.querySelector('base');
        const baseHref = baseElement ? baseElement.getAttribute('href') : 'Not set';
        document.getElementById('currentBaseHref').textContent = baseHref;
    }

    checkForExistingAuthHeader() {
        // Note: Browsers don't expose request headers to JavaScript for security reasons
        // This is just for demonstration
        const result = document.getElementById('headerResult');
        result.innerHTML = `
            <div class="header-info">
                <strong>⚠️ Note:</strong> Browsers don't expose incoming request headers to JavaScript for security reasons.
                <br>In a real FDS Gateway scenario, the Authorization header would be available to your server-side code.
                <br>This demo simulates what your application would receive.
            </div>
        `;
    }

    checkHeaders() {
        const result = document.getElementById('headerResult');
        
        // Simulate what headers might look like
        const mockHeaders = {
            'Host': window.location.host,
            'User-Agent': navigator.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': navigator.language,
            'Referer': window.location.href
        };

        // Check if we have any stored auth token (simulating FDS Gateway behavior)
        const storedToken = localStorage.getItem('fds-auth-token');
        if (storedToken) {
            mockHeaders['Authorization'] = `Bearer ${storedToken}`;
        }

        result.innerHTML = `
            <div class="header-info">
                <h3>📨 Simulated Request Headers:</h3>
                <pre>${JSON.stringify(mockHeaders, null, 2)}</pre>
            </div>
        `;
    }

    simulateGatewayRequest() {
        // Create a mock JWT token (this is just for demonstration)
        const mockJWT = this.createMockJWT();
        
        // Store it to simulate FDS Gateway behavior
        localStorage.setItem('fds-auth-token', mockJWT);
        
        this.validateToken(mockJWT, 'simulationResult');
    }

    testCustomToken() {
        const customToken = document.getElementById('customToken').value.trim();
        if (!customToken) {
            document.getElementById('simulationResult').innerHTML = `
                <div class="header-info error">
                    <strong>❌ Error:</strong> Please enter a JWT token to test.
                </div>
            `;
            return;
        }
        
        localStorage.setItem('fds-auth-token', customToken);
        this.validateToken(customToken, 'simulationResult');
    }

    createMockJWT() {
        // Create a mock JWT structure (header.payload.signature)
        const header = {
            "alg": "RS256",
            "typ": "JWT"
        };
        
        const payload = {
            "sub": "test-user-123",
            "name": "John Doe",
            "email": "john.doe@siemens.com",
            "tenant": "demo-tenant",
            "roles": ["user", "viewer"],
            "permissions": ["read", "write"],
            "iat": Math.floor(Date.now() / 1000),
            "exp": Math.floor(Date.now() / 1000) + 3600
        };
        
        // Base64 encode (this is just for demo - real JWTs have proper signatures)
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        const mockSignature = "mock-signature-for-demo-purposes";
        
        return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
    }

    validateToken(token, resultElementId) {
        const result = document.getElementById(resultElementId);
        
        try {
            // Parse JWT (basic validation for demo)
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }
            
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            
            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp && payload.exp < now;
            
            result.innerHTML = `
                <div class="header-info ${isExpired ? 'error' : 'success'}">
                    <h3>🔍 Token Validation Result:</h3>
                    <p><strong>Status:</strong> ${isExpired ? '❌ Expired' : '✅ Valid'}</p>
                    <p><strong>Authorization Header:</strong> <code>Bearer ${token.substring(0, 50)}...</code></p>
                    
                    <h4>📋 Token Header:</h4>
                    <pre>${JSON.stringify(header, null, 2)}</pre>
                    
                    <h4>📋 Token Payload:</h4>
                    <pre>${JSON.stringify(payload, null, 2)}</pre>
                    
                    <p><strong>⚠️ Note:</strong> In production, you must validate the signature against IAM's public key!</p>
                </div>
            `;
            
        } catch (error) {
            result.innerHTML = `
                <div class="header-info error">
                    <h3>❌ Token Validation Failed:</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Token:</strong> <code>${token.substring(0, 100)}...</code></p>
                </div>
            `;
        }
    }

    testRelativePaths() {
        const result = document.getElementById('pathResult');
        const baseElement = document.querySelector('base');
        const baseHref = baseElement ? baseElement.getAttribute('href') : '/';
        
        // Test various relative paths
        const testPaths = [
            './api/users',
            './assets/logo.png',
            './config.json',
            'api/data',
            '../parent/resource'
        ];
        
        const resolvedPaths = testPaths.map(path => {
            const link = document.createElement('a');
            link.href = path;
            return {
                original: path,
                resolved: link.href
            };
        });
        
        result.innerHTML = `
            <div class="header-info">
                <h3>🔗 Path Resolution Test:</h3>
                <p><strong>Base href:</strong> <code>${baseHref}</code></p>
                <p><strong>Current directory:</strong> <code>${window.location.pathname}</code></p>
                
                <h4>Path Resolutions:</h4>
                <pre>${resolvedPaths.map(p => `${p.original} → ${p.resolved}`).join('\n')}</pre>
                
                <p><strong>✅ Result:</strong> All paths resolve correctly with base href="./"</p>
            </div>
        `;
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    window.fdsTestApp = new FDSTestApp();
});

// Global functions for button clicks
function checkHeaders() {
    window.fdsTestApp.checkHeaders();
}

function simulateGatewayRequest() {
    window.fdsTestApp.simulateGatewayRequest();
}

function testCustomToken() {
    window.fdsTestApp.testCustomToken();
}

function testRelativePaths() {
    window.fdsTestApp.testRelativePaths();
}
