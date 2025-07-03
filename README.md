# OIDC Library Tester

A comprehensive web application for testing OpenID Connect (OIDC) authentication flows. This application can be easily deployed to GitHub Pages and supports various OIDC providers.

## Features

- 🔐 **Complete OIDC Flow Testing**: Authorization Code, Implicit, and Hybrid flows
- 🎯 **Multiple Provider Support**: Azure AD, Google, Auth0, Keycloak, and custom providers
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Token Management**: View, renew, and revoke tokens
- 🛠️ **Debug Tools**: Comprehensive logging and error handling
- 💾 **Configuration Persistence**: Saves settings in local storage
- 🎨 **Modern UI**: Beautiful Bootstrap-based interface

## Quick Start

1. **Clone or download** this repository
2. **Configure your OIDC provider** in the web interface
3. **Deploy to GitHub Pages** or serve locally

### Local Development

```bash
# Serve the files using any static web server
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### GitHub Pages Deployment

1. Fork this repository
2. Go to your repository settings
3. Scroll down to "Pages" section
4. Set source to "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Your app will be available at `https://yourusername.github.io/repository-name`

## Configuration

### Required Fields

- **Authority URL**: Your OIDC provider's discovery endpoint
- **Client ID**: Your application's client identifier

### Optional Fields

- **Scope**: OAuth 2.0 scopes (default: `openid profile email`)
- **Response Type**: Authorization flow type
- **Load User Info**: Automatically fetch user information
- **Automatic Silent Renew**: Enable automatic token renewal

### Provider Examples

#### Azure AD
```
Authority: https://login.microsoftonline.com/{tenant-id}/v2.0
Client ID: {your-application-id}
Scope: openid profile email
```

#### Google
```
Authority: https://accounts.google.com
Client ID: {your-client-id}.apps.googleusercontent.com
Scope: openid profile email
```

#### Auth0
```
Authority: https://{your-domain}.auth0.com
Client ID: {your-client-id}
Scope: openid profile email
```

#### Keycloak
```
Authority: https://{your-keycloak-domain}/auth/realms/{realm}
Client ID: {your-client-id}
Scope: openid profile email
```

## Usage

1. **Configure**: Enter your OIDC provider details in the configuration panel
2. **Initialize**: Click "Initialize OIDC Client" to set up the client
3. **Test Authentication**: Use the action buttons to test various OIDC operations:
   - **Login**: Start the authentication flow
   - **Logout**: Sign out the user
   - **Get User**: Retrieve current user information
   - **Renew Token**: Refresh authentication tokens
   - **Silent Renew**: Attempt silent token renewal
   - **Revoke Token**: Revoke the current access token
   - **Check Session**: Verify session status

## Available Actions

### Authentication Actions
- **Login**: Redirects to the OIDC provider for authentication
- **Logout**: Signs out the user and clears session
- **Get User**: Retrieves stored user information
- **Check Session**: Verifies current session status

### Token Management
- **Renew Token**: Initiates token refresh flow
- **Silent Renew**: Attempts background token renewal
- **Revoke Token**: Revokes the current access token

### Debugging Tools
- **View Logs**: Real-time operation logs with timestamps
- **User Info**: Complete user profile and claims
- **Token Details**: Access tokens, ID tokens, and expiration info
- **Configuration**: Current OIDC client configuration

## Security Considerations

- This tool is designed for **development and testing purposes**
- Always use HTTPS in production environments
- Never expose client secrets in client-side applications
- Use appropriate redirect URIs in your OIDC provider configuration
- Consider implementing proper CSRF protection for production use

## OIDC Provider Setup

### Redirect URI Configuration
Make sure to configure the following redirect URIs in your OIDC provider:

For local development:
```
http://localhost:8000
```

For GitHub Pages:
```
https://yourusername.github.io/repository-name
```

### Client Configuration
- **Application Type**: Single Page Application (SPA) or Public Client
- **Grant Types**: Authorization Code (with PKCE)
- **Response Types**: `code` (recommended) or `id_token` for implicit flow

## Troubleshooting

### Common Issues

1. **"Invalid Redirect URI"**
   - Ensure the redirect URI in your OIDC provider matches exactly
   - Check for trailing slashes and protocol (http vs https)

2. **"Client Not Found"**
   - Verify the Client ID is correct
   - Ensure the client is properly configured in your OIDC provider

3. **CORS Errors**
   - Check if your OIDC provider allows cross-origin requests
   - Some providers require specific CORS configuration

4. **Token Expiry Issues**
   - Enable automatic silent renew
   - Check token lifetime settings in your provider

### Debug Tips

- Use the browser's developer tools network tab to inspect requests
- Check the logs tab for detailed error messages
- Verify the configuration tab shows correct settings
- Test with different response types if one doesn't work

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ Internet Explorer (limited support)

## Dependencies

- **oidc-client-ts**: Modern OIDC client library
- **Bootstrap 5**: UI framework
- **Font Awesome**: Icons

All dependencies are loaded via CDN for easy deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review OIDC provider documentation
3. Open an issue in this repository

---

**Note**: This tool is for development and testing purposes. Always follow security best practices when implementing OIDC in production applications.
