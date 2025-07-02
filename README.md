# FDS IAM Test Application

A simple test application to verify FDS Gateway integration and Authorization header handling.

## 🚀 Quick Start

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Visit your GitHub Pages URL to test the application

## 🧪 Testing Features

- **Authorization Header Detection**: Simulates how your app would receive JWT tokens from FDS Gateway
- **Base Href Validation**: Tests that `base href="./"` works correctly for subdirectory deployment
- **JWT Token Parsing**: Basic JWT validation (signature verification would be done server-side)
- **Path Resolution**: Verifies relative paths work correctly

## 📋 What This Tests

### Base Href Configuration
The app uses `<base href="./">` as recommended in the FDS documentation to ensure proper path resolution when deployed under a subdirectory path like `/{webApp}/`.

### Authorization Header Simulation
While browsers don't expose request headers to JavaScript, this app simulates what your server-side code would receive from the FDS Gateway:
```
Authorization: Bearer <JWT_TOKEN>
```

### JWT Token Structure
Tests parsing of JWT tokens with typical FDS IAM payload:
```json
{
  "sub": "user-id",
  "tenant": "tenant-name",
  "roles": ["user", "admin"],
  "permissions": ["read", "write"],
  "exp": 1234567890
}
```

## 🔧 Usage

1. **Check Headers**: View simulated request headers
2. **Simulate Gateway**: Test with mock JWT token
3. **Custom Token**: Test with your own JWT token
4. **Path Test**: Verify relative path resolution

## 📝 Notes

- This is a client-side only demo for GitHub Pages compatibility
- Real JWT signature validation must be done server-side against IAM's public key
- The Authorization header would be automatically added by the FDS Gateway in production

## 🔗 Deployment

Deploy to GitHub Pages:
1. Go to repository Settings → Pages  
2. Select "Deploy from a branch"
3. Choose "main" branch and "/ (root)" folder
4. Your app will be available at `https://yourusername.github.io/repository-name/`

This tests the exact scenario described in the FDS documentation where your app runs under a subdirectory path.
