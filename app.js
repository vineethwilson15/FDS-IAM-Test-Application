// OIDC Tester Application
class OIDCTester {
    constructor() {
        this.userManager = null;
        this.user = null;
        this.config = null;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setRedirectUri();
        this.loadSavedConfig();
        this.log('OIDC Tester initialized');
        
        // Handle redirect callback
        this.handleCallback();
    }

    setupEventListeners() {
        // Configuration form
        document.getElementById('oidcConfig').addEventListener('submit', (e) => {
            e.preventDefault();
            this.initializeOIDC();
        });

        // Action buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('getUserBtn').addEventListener('click', () => this.getUser());
        document.getElementById('renewTokenBtn').addEventListener('click', () => this.renewToken());
        document.getElementById('silentRenewBtn').addEventListener('click', () => this.silentRenew());
        document.getElementById('revokeTokenBtn').addEventListener('click', () => this.revokeToken());
        document.getElementById('checkSessionBtn').addEventListener('click', () => this.checkSession());

        // Utility buttons
        document.getElementById('clearStorage').addEventListener('click', () => this.clearStorage());
        document.getElementById('clearResults').addEventListener('click', () => this.clearResults());
        document.getElementById('copyResults').addEventListener('click', () => this.copyResults());

        // Auto-save configuration
        ['authority', 'clientId', 'clientSecret', 'scope', 'responseType'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.saveConfig());
        });
        
        ['loadUserInfo', 'automaticSilentRenew'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.saveConfig());
        });
    }

    setRedirectUri() {
        const redirectUri = window.location.origin + window.location.pathname;
        document.getElementById('redirectUri').value = redirectUri;
    }

    saveConfig() {
        const config = this.getConfigFromForm();
        localStorage.setItem('oidc-tester-config', JSON.stringify(config));
    }

    loadSavedConfig() {
        const saved = localStorage.getItem('oidc-tester-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.setConfigToForm(config);
                this.log('Loaded saved configuration');
            } catch (e) {
                this.log('Error loading saved configuration: ' + e.message, 'error');
            }
        }
    }

    getConfigFromForm() {
        return {
            authority: document.getElementById('authority').value,
            client_id: document.getElementById('clientId').value,
            client_secret: document.getElementById('clientSecret').value,
            redirect_uri: document.getElementById('redirectUri').value,
            scope: document.getElementById('scope').value,
            response_type: document.getElementById('responseType').value,
            loadUserInfo: document.getElementById('loadUserInfo').checked,
            automaticSilentRenew: document.getElementById('automaticSilentRenew').checked
        };
    }

    setConfigToForm(config) {
        document.getElementById('authority').value = config.authority || '';
        document.getElementById('clientId').value = config.client_id || '';
        document.getElementById('clientSecret').value = config.client_secret || '';
        document.getElementById('scope').value = config.scope || 'openid profile email';
        document.getElementById('responseType').value = config.response_type || 'code';
        document.getElementById('loadUserInfo').checked = config.loadUserInfo || false;
        document.getElementById('automaticSilentRenew').checked = config.automaticSilentRenew || false;
    }

    async initializeOIDC() {
        try {
            this.config = this.getConfigFromForm();
            
            // Validate required fields
            if (!this.config.authority || !this.config.client_id) {
                throw new Error('Authority and Client ID are required');
            }

            // Additional configuration
            this.config.post_logout_redirect_uri = this.config.redirect_uri;
            this.config.silent_redirect_uri = this.config.redirect_uri;
            this.config.filterProtocolClaims = true;
            this.config.loadUserInfo = this.config.loadUserInfo;
            this.config.automaticSilentRenew = this.config.automaticSilentRenew;
            
            // Determine client type and authentication method
            const hasClientSecret = this.config.client_secret && this.config.client_secret.trim() !== '';
            
            if (hasClientSecret) {
                // Confidential client - use client secret
                this.config.client_authentication = 'client_secret_post';
                this.config.usePkce = false; // Don't use PKCE when we have client secret
                this.log('Using confidential client with client secret', 'info');
            } else {
                // Public client - use PKCE
                this.config.usePkce = true;
                delete this.config.client_secret; // Remove empty client secret
                this.log('Using public client with PKCE', 'info');
            }
            
            // For custom providers that may not have full OIDC discovery
            if (this.config.authority.includes('cloud.sws.siemens.com')) {
                this.config.authorization_endpoint = 'https://cloud.sws.siemens.com/oauth/authorize';
                this.config.token_endpoint = 'https://cloud.sws.siemens.com/oauth/token';
                this.config.userinfo_endpoint = 'https://cloud.sws.siemens.com/oauth/userinfo';
                this.config.end_session_endpoint = 'https://cloud.sws.siemens.com/oauth/logout';
                this.config.jwks_uri = 'https://cloud.sws.siemens.com/.well-known/jwks.json';
                this.config.issuer = 'https://cloud.sws.siemens.com';
                
                // Disable discovery since we're providing explicit endpoints
                this.config.loadUserInfo = false; // Disable if userinfo endpoint is not available
                this.config.metadata = {
                    authorization_endpoint: this.config.authorization_endpoint,
                    token_endpoint: this.config.token_endpoint,
                    userinfo_endpoint: this.config.userinfo_endpoint,
                    end_session_endpoint: this.config.end_session_endpoint,
                    jwks_uri: this.config.jwks_uri,
                    issuer: this.config.issuer
                };
            }

            this.userManager = new oidc.UserManager(this.config);

            // Setup event handlers
            this.setupUserManagerEvents();

            this.log('OIDC Client initialized successfully');
            this.updateStatus('Initialized', 'success');
            this.enableButtons();
            this.displayConfig();

            // Try to get existing user
            await this.getUser();

        } catch (error) {
            this.log('Error initializing OIDC: ' + error.message, 'error');
            this.updateStatus('Error', 'danger');
        }
    }

    setupUserManagerEvents() {
        this.userManager.events.addUserLoaded((user) => {
            this.log('User loaded from storage');
            this.user = user;
            this.updateUserInfo();
            this.updateTokenInfo();
        });

        this.userManager.events.addUserUnloaded(() => {
            this.log('User unloaded');
            this.user = null;
            this.updateUserInfo();
            this.updateTokenInfo();
        });

        this.userManager.events.addAccessTokenExpiring(() => {
            this.log('Access token expiring', 'warning');
        });

        this.userManager.events.addAccessTokenExpired(() => {
            this.log('Access token expired', 'warning');
            this.updateStatus('Token Expired', 'warning');
        });

        this.userManager.events.addSilentRenewError((error) => {
            this.log('Silent renew error: ' + error.message, 'error');
        });

        this.userManager.events.addUserSignedOut(() => {
            this.log('User signed out');
            this.updateStatus('Signed Out', 'secondary');
        });
    }

    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        
        if (urlParams.has('code') || urlParams.has('state') || hash.includes('access_token') || hash.includes('id_token')) {
            this.log('Handling authentication callback...');
            
            // Check for error parameters first
            if (urlParams.has('error')) {
                const error = urlParams.get('error');
                const errorDescription = urlParams.get('error_description');
                const errorUri = urlParams.get('error_uri');
                
                this.log(`OAuth Error: ${error}`, 'error');
                if (errorDescription) {
                    this.log(`Error Description: ${errorDescription}`, 'error');
                }
                if (errorUri) {
                    this.log(`Error URI: ${errorUri}`, 'error');
                }
                this.updateStatus('OAuth Error', 'danger');
                return;
            }
            
            try {
                // Initialize with saved config first
                const saved = localStorage.getItem('oidc-tester-config');
                if (saved) {
                    const config = JSON.parse(saved);
                    this.setConfigToForm(config);
                    await this.initializeOIDC();
                }

                if (this.userManager) {
                    const user = await this.userManager.signinRedirectCallback();
                    this.user = user;
                    this.log('Authentication successful');
                    this.updateStatus('Authenticated', 'success');
                    this.updateUserInfo();
                    this.updateTokenInfo();
                    
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                this.log('Callback error: ' + error.message, 'error');
                this.log('Error details: ' + JSON.stringify(error, null, 2), 'error');
                
                // Additional debugging for token errors
                if (error.message.includes('token') || error.message.includes('credentials')) {
                    this.log('Token Error Debug Info:', 'error');
                    this.log('- Check if redirect_uri matches exactly in your provider', 'error');
                    this.log('- Verify client_id is correct', 'error');
                    this.log('- For Siemens: Make sure PKCE is enabled in your OAuth app', 'error');
                    this.log('- Check if the authorization code is still valid (not expired)', 'error');
                }
                
                this.updateStatus('Callback Error', 'danger');
            }
        }
    }

    async login() {
        try {
            this.log('Initiating login...');
            
            // Debug info for Siemens provider
            if (this.config && this.config.authority.includes('cloud.sws.siemens.com')) {
                this.log('Siemens OAuth Debug Info:', 'info');
                this.log(`- Authority: ${this.config.authority}`, 'info');
                this.log(`- Client ID: ${this.config.client_id}`, 'info');
                this.log(`- Client Secret: ${this.config.client_secret ? 'Present' : 'Not provided'}`, 'info');
                this.log(`- Redirect URI: ${this.config.redirect_uri}`, 'info');
                this.log(`- Response Type: ${this.config.response_type}`, 'info');
                this.log(`- PKCE Enabled: ${this.config.usePkce}`, 'info');
                this.log(`- Client Authentication: ${this.config.client_authentication || 'default'}`, 'info');
                this.log(`- Scope: ${this.config.scope}`, 'info');
            }
            
            await this.userManager.signinRedirect();
        } catch (error) {
            this.log('Login error: ' + error.message, 'error');
            this.log('Error details: ' + JSON.stringify(error, null, 2), 'error');
            
            // Specific troubleshooting for Siemens
            if (this.config && this.config.authority.includes('cloud.sws.siemens.com')) {
                this.log('Siemens Troubleshooting Tips:', 'warning');
                this.log('1. Ensure your redirect URI exactly matches what is registered in Siemens OAuth app', 'warning');
                this.log('2. Make sure the client ID is correct: tiacloudservices1-xcdev-authcode', 'warning');
                this.log('3. Check if your OAuth app supports PKCE (recommended for SPA)', 'warning');
                this.log('4. Verify your application has proper permissions', 'warning');
            }
        }
    }

    async logout() {
        try {
            this.log('Initiating logout...');
            await this.userManager.signoutRedirect();
        } catch (error) {
            this.log('Logout error: ' + error.message, 'error');
        }
    }

    async getUser() {
        try {
            this.user = await this.userManager.getUser();
            if (this.user) {
                this.log('User retrieved from storage');
                this.updateStatus('Authenticated', 'success');
                this.updateUserInfo();
                this.updateTokenInfo();
            } else {
                this.log('No user found in storage');
                this.updateStatus('Not Authenticated', 'secondary');
                this.updateUserInfo();
                this.updateTokenInfo();
            }
        } catch (error) {
            this.log('Error getting user: ' + error.message, 'error');
        }
    }

    async renewToken() {
        try {
            this.log('Renewing token...');
            const user = await this.userManager.signinRedirect();
            this.user = user;
            this.log('Token renewed successfully');
            this.updateTokenInfo();
        } catch (error) {
            this.log('Token renewal error: ' + error.message, 'error');
        }
    }

    async silentRenew() {
        try {
            this.log('Attempting silent renew...');
            const user = await this.userManager.signinSilent();
            this.user = user;
            this.log('Silent renew successful');
            this.updateTokenInfo();
        } catch (error) {
            this.log('Silent renew error: ' + error.message, 'error');
        }
    }

    async revokeToken() {
        try {
            if (!this.user) {
                throw new Error('No user logged in');
            }
            this.log('Revoking token...');
            await this.userManager.revokeAccessToken();
            this.log('Token revoked successfully');
        } catch (error) {
            this.log('Token revocation error: ' + error.message, 'error');
        }
    }

    async checkSession() {
        try {
            this.log('Checking session state...');
            const user = await this.userManager.getUser();
            if (user) {
                this.log(`Session active. Expires at: ${new Date(user.expires_at * 1000).toLocaleString()}`);
                document.getElementById('sessionState').textContent = 'Active';
                document.getElementById('sessionState').className = 'badge bg-success fs-6 mb-2';
            } else {
                this.log('No active session');
                document.getElementById('sessionState').textContent = 'Inactive';
                document.getElementById('sessionState').className = 'badge bg-danger fs-6 mb-2';
            }
        } catch (error) {
            this.log('Session check error: ' + error.message, 'error');
            document.getElementById('sessionState').textContent = 'Error';
            document.getElementById('sessionState').className = 'badge bg-danger fs-6 mb-2';
        }
    }

    updateStatus(status, type) {
        const statusElement = document.getElementById('authStatus');
        statusElement.textContent = status;
        statusElement.className = `badge bg-${type} fs-6 mb-2 status-change`;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            statusElement.classList.remove('status-change');
        }, 500);
    }

    updateUserInfo() {
        const userOutput = document.getElementById('userOutput');
        const userInfo = document.getElementById('userInfo');
        
        if (this.user) {
            userOutput.textContent = JSON.stringify({
                profile: this.user.profile,
                scopes: this.user.scopes,
                token_type: this.user.token_type,
                expires_at: new Date(this.user.expires_at * 1000).toLocaleString(),
                expires_in: this.user.expires_in
            }, null, 2);
            
            const name = this.user.profile.name || this.user.profile.preferred_username || this.user.profile.email || 'User';
            userInfo.innerHTML = `<i class="fas fa-user me-2"></i>${name}`;
        } else {
            userOutput.textContent = 'No user information available';
            userInfo.innerHTML = '';
        }
    }

    updateTokenInfo() {
        const tokenOutput = document.getElementById('tokenOutput');
        const tokenExpiry = document.getElementById('tokenExpiry');
        
        if (this.user) {
            const tokens = {
                access_token: this.user.access_token ? this.user.access_token.substring(0, 50) + '...' : null,
                id_token: this.user.id_token ? this.user.id_token.substring(0, 50) + '...' : null,
                refresh_token: this.user.refresh_token ? this.user.refresh_token.substring(0, 50) + '...' : null,
                token_type: this.user.token_type,
                expires_at: new Date(this.user.expires_at * 1000).toLocaleString(),
                expires_in: this.user.expires_in + ' seconds'
            };
            
            tokenOutput.textContent = JSON.stringify(tokens, null, 2);
            
            const expiryDate = new Date(this.user.expires_at * 1000);
            const now = new Date();
            const isExpired = expiryDate < now;
            
            tokenExpiry.textContent = expiryDate.toLocaleTimeString();
            tokenExpiry.className = `badge ${isExpired ? 'bg-danger' : 'bg-success'} fs-6 mb-2`;
        } else {
            tokenOutput.textContent = 'No token information available';
            tokenExpiry.textContent = '-';
            tokenExpiry.className = 'badge bg-secondary fs-6 mb-2';
        }
    }

    displayConfig() {
        const configOutput = document.getElementById('configOutput');
        if (this.config) {
            // Hide sensitive information
            const sanitizedConfig = { ...this.config };
            delete sanitizedConfig.client_secret;
            
            configOutput.textContent = JSON.stringify(sanitizedConfig, null, 2);
        }
    }

    enableButtons() {
        const buttons = ['loginBtn', 'logoutBtn', 'getUserBtn', 'renewTokenBtn', 'silentRenewBtn', 'revokeTokenBtn', 'checkSessionBtn'];
        buttons.forEach(id => {
            document.getElementById(id).disabled = false;
        });
    }

    clearStorage() {
        if (confirm('This will clear all stored authentication data. Continue?')) {
            localStorage.clear();
            sessionStorage.clear();
            if (this.userManager) {
                this.userManager.clearStaleState();
            }
            this.log('Storage cleared');
            location.reload();
        }
    }

    clearResults() {
        document.getElementById('logOutput').textContent = '';
        document.getElementById('userOutput').textContent = '';
        document.getElementById('tokenOutput').textContent = '';
        document.getElementById('configOutput').textContent = '';
    }

    async copyResults() {
        const activeTab = document.querySelector('.tab-pane.active pre');
        if (activeTab) {
            try {
                await navigator.clipboard.writeText(activeTab.textContent);
                const btn = document.getElementById('copyResults');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.classList.add('copy-success');
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('copy-success');
                }, 2000);
            } catch (error) {
                this.log('Failed to copy to clipboard: ' + error.message, 'error');
            }
        }
    }

    log(message, type = 'info') {
        const logOutput = document.getElementById('logOutput');
        const timestamp = new Date().toLocaleTimeString();
        const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        
        const logEntry = `[${timestamp}] ${icon} ${message}\n`;
        logOutput.textContent += logEntry;
        logOutput.scrollTop = logOutput.scrollHeight;
        
        console.log(`[OIDC Tester] ${message}`);
    }
}

// Preset configurations
window.loadPreset = function(provider) {
    const presets = {
        azure: {
            authority: 'https://login.microsoftonline.com/{tenant-id}/v2.0',
            scope: 'openid profile email',
            responseType: 'code'
        },
        google: {
            authority: 'https://accounts.google.com',
            scope: 'openid profile email',
            responseType: 'code'
        },
        auth0: {
            authority: 'https://{your-domain}.auth0.com',
            scope: 'openid profile email',
            responseType: 'code'
        },
        keycloak: {
            authority: 'https://{your-keycloak-domain}/auth/realms/{realm}',
            scope: 'openid profile email',
            responseType: 'code'
        },
        siemens: {
            authority: 'https://cloud.sws.siemens.com',
            client_id: 'tiacloudservices1-xcdev-authcode',
            client_secret: 'cr28grVlDykUNHupPorM23GrvNUxuS0NP8FMZN9NmB5',
            scope: 'openid profile email',
            responseType: 'code'
        }
    };

    const preset = presets[provider];
    if (preset) {
        document.getElementById('authority').value = preset.authority;
        document.getElementById('scope').value = preset.scope;
        document.getElementById('responseType').value = preset.responseType;
        
        // Set client credentials if available
        if (preset.client_id) {
            document.getElementById('clientId').value = preset.client_id;
        }
        if (preset.client_secret) {
            document.getElementById('clientSecret').value = preset.client_secret;
        }
        
        // Special handling for Siemens
        if (provider === 'siemens') {
            document.getElementById('loadUserInfo').checked = false;
        }
        
        // Show helpful info
        const tester = window.oidcTester;
        if (tester) {
            tester.log(`Loaded ${provider.toUpperCase()} preset. ${provider === 'siemens' ? 'Siemens-specific configuration applied with client secret.' : 'Please update the authority URL with your specific values.'}`, 'info');
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.oidcTester = new OIDCTester();
});

// Handle page visibility changes for session monitoring
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.oidcTester && window.oidcTester.userManager) {
        window.oidcTester.getUser();
    }
});
