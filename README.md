# FDS IAM Bearer Token Tester

A simple web application to test if Bearer tokens are being properly appended to HTTP request headers when using Foundational Services (FDS) IAM with the Gateway integration.

## 🎯 Purpose

This tool helps developers verify that:
- FDS Gateway is properly injecting `Authorization: Bearer <JWT>` headers
- JWT tokens are valid and contain expected user information
- The application is correctly receiving authenticated requests

## 🚀 Features

- **Real-time Token Testing**: Send HTTP requests and analyze if Bearer tokens are present
- **JWT Analysis**: Automatically detects and analyzes JWT token structure
- **Multiple HTTP Methods**: Test with GET, POST, PUT, DELETE requests
- **Manual Token Testing**: Option to test with manually provided tokens
- **Beautiful UI**: Modern, responsive interface with clear results display
- **GitHub Pages Ready**: Configured for easy deployment to GitHub Pages

## 📋 How to Use

1. **Deploy to GitHub Pages**:
   - Create a new GitHub repository
   - Upload these files to the repository
   - Enable GitHub Pages in repository settings
   - Access your app at `https://yourusername.github.io/repository-name`

2. **Configure for FDS Gateway**:
   - Deploy the app behind the FDS Gateway at your configured URL
   - The Gateway should automatically inject Bearer tokens
   - Test using the web interface

3. **Test Bearer Token Injection**:
   - Enter a test endpoint URL (default: `https://httpbin.org/headers`)
   - Click "Send Test Request"
   - Analyze the results to see if Bearer token is present

## 🔧 Configuration

The app is pre-configured with:
- **Base href**: Set to `./` for subdirectory hosting (required for FDS Gateway)
- **CORS handling**: Properly configured for cross-origin requests
- **Default test endpoint**: httpbin.org/headers (shows all request headers)

## 📁 File Structure

```
├── index.html          # Main HTML file with form and results display
├── styles.css          # Modern CSS styling with responsive design
├── script.js           # JavaScript logic for testing and analysis
└── README.md          # This documentation file
```

## 🧪 Testing Scenarios

1. **Automatic Token Injection** (FDS Gateway):
   - Deploy behind FDS Gateway
   - Leave "Manual Bearer Token" field empty
   - Send request to see if Gateway injects the token

2. **Manual Token Testing**:
   - Enter a JWT token in the "Manual Bearer Token" field
   - Verify the token is properly included in requests

3. **Different HTTP Methods**:
   - Test with GET, POST, PUT, DELETE methods
   - Verify token injection works for all methods

## 🔍 Understanding Results

The app displays three sections of results:

1. **Request Information**: Shows the request details being sent
2. **Response**: Shows the server response and headers
3. **Bearer Token Analysis**: Analyzes if a Bearer token was found and provides JWT details

## 🌐 FDS Gateway Integration

When deployed behind the FDS Gateway (at your configured URL like `https://xcdev.us1.sws.siemens.com/tiaportalcloud-xcdev/`), the Gateway should automatically:

- Handle user authentication
- Inject `Authorization: Bearer <JWT>` header
- Forward requests to your application endpoints
- Include user, tenant, and permission information in the JWT

## 🛠️ Troubleshooting

**No Bearer token found?**
- Verify the app is deployed behind FDS Gateway
- Check if the Gateway is properly configured
- Ensure user is authenticated with SiemensID

**CORS errors?**
- Use endpoints that support CORS (like httpbin.org)
- Ensure your test endpoints allow cross-origin requests

**JWT parsing errors?**
- Verify the token is a valid JWT (3 parts separated by dots)
- Check if the token is properly base64 encoded

## 📝 Notes

- The `base href="./"` setting is crucial for proper operation behind FDS Gateway
- All JWT content is masked in the UI for security purposes
- The app includes debug utilities accessible via browser console (`window.FDSTest`)

## 🔗 Related Links

- [FDS IAM Documentation](https://your-fds-docs-link)
- [Your FDS Gateway URL](https://xcdev.us1.sws.siemens.com/tiaportalcloud-xcdev/)
- [HTTPBin.org](https://httpbin.org) - Useful for testing HTTP requests
