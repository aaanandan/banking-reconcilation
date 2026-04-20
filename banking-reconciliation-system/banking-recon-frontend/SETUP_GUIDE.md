# Banking Reconciliation SaaS - Frontend Setup Guide

Complete guide for setting up the development environment for the Banking Reconciliation SaaS frontend application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Building for Production](#building-for-production)
8. [IDE Setup](#ide-setup)
9. [Troubleshooting](#troubleshooting)
10. [Common Issues](#common-issues)

## Prerequisites

### Required Software

**Node.js and npm**
- Node.js: Version 18.x or higher (LTS recommended)
- npm: Version 9.x or higher (comes with Node.js)

Check your versions:
```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

Download from: https://nodejs.org/

**Git**
- Git: Version 2.x or higher

Check your version:
```bash
git --version  # Should be 2.x.x or higher
```

Download from: https://git-scm.com/

### Optional Software

**VSCode** (Recommended IDE)
- Visual Studio Code: Latest version
- Download from: https://code.visualstudio.com/

**Chrome/Firefox** (Development Browsers)
- Chrome: Latest version (for React DevTools)
- Firefox: Latest version

### Backend Requirement

The frontend requires the backend API to be running. See backend documentation for setup instructions.

**Expected Backend URL:**
- Development: `http://localhost:3000/api`
- Production: Configure in environment variables

## Environment Setup

### 1. Clone the Repository

```bash
# Clone the main repository
git clone <repository-url>
cd banking-reconciliation-system

# Navigate to frontend directory
cd banking-recon-frontend
```

### 2. Verify Directory Structure

```bash
ls -la
```

You should see:
```
├── public/
├── src/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

### 3. Check Node Version

```bash
node --version
```

If you need to switch Node versions, consider using **nvm** (Node Version Manager):

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install nvm (Windows)
# Download from: https://github.com/coreybutler/nvm-windows

# Install and use Node 18
nvm install 18
nvm use 18
```

## Installation

### 1. Install Dependencies

```bash
# Install all npm packages
npm install
```

This will install:
- React 18 + React DOM
- TypeScript 5
- Vite
- Ant Design 5
- React Router v6
- Axios
- Day.js
- And all development dependencies

**Installation time:** ~2-5 minutes depending on internet speed

### 2. Verify Installation

```bash
# Check installed packages
npm list --depth=0
```

You should see all major dependencies listed.

### 3. Install Global Tools (Optional)

```bash
# TypeScript compiler (optional, for global tsc command)
npm install -g typescript

# ESLint (optional, for global linting)
npm install -g eslint
```

## Configuration

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_TIMEOUT=30000

# Application
REACT_APP_NAME=Banking Reconciliation
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_DEBUG=true
REACT_APP_ENABLE_ANALYTICS=false

# Optional: SSO Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

**Important Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REACT_APP_API_URL | Backend API URL | http://localhost:3000/api | Yes |
| REACT_APP_TIMEOUT | API request timeout (ms) | 30000 | No |
| REACT_APP_NAME | Application name | Banking Reconciliation | No |
| REACT_APP_ENABLE_DEBUG | Enable debug mode | false | No |

### 3. Verify Backend Connection

Ensure the backend is running and accessible:

```bash
# Test backend health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Running the Application

### Development Server

```bash
# Start development server
npm run dev
```

**Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.x:5173/
  ➜  press h to show help
```

**Features:**
- Hot Module Replacement (HMR) - instant updates
- Fast refresh - preserves component state
- Source maps - for debugging
- Port: 5173 (default, configurable in vite.config.ts)

### Access the Application

1. Open browser: http://localhost:5173
2. You should see the login page
3. If you see errors, check the browser console

### Development Server Options

```bash
# Start on specific port
npm run dev -- --port 3001

# Start with network access disabled
npm run dev -- --host 127.0.0.1

# Start and open browser automatically
npm run dev -- --open
```

### Stop the Server

Press `Ctrl + C` in the terminal

## Development Workflow

### 1. Code Structure

```
src/
├── api/              # API integration layer
├── components/       # React components (organized by feature)
├── routes/          # Routing configuration
├── utils/           # Utility functions
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

### 2. Making Changes

**Component Development:**
```bash
# 1. Create/edit component file
src/components/YourFeature/YourComponent.tsx

# 2. Save file (HMR will auto-reload)

# 3. Check browser for changes
```

**Utility Development:**
```bash
# 1. Create/edit utility file
src/utils/yourUtils.ts

# 2. Export functions
export const yourFunction = () => { ... };

# 3. Import in component
import { yourFunction } from '../../utils/yourUtils';
```

**API Integration:**
```bash
# 1. Add API endpoint in src/api/modules.ts
export const yourApi = {
  list: (params: ListParams) => apiClient.get('/your-endpoint', { params }),
};

# 2. Use in component
import { yourApi } from '../../api';
const response = await yourApi.list({ page: 1 });
```

### 3. Type Checking

```bash
# Run TypeScript type checker
npm run type-check

# Watch mode (auto type-check on changes)
tsc --noEmit --watch
```

### 4. Linting

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

### 5. Code Formatting

```bash
# Format code with Prettier (if configured)
npm run format

# Check formatting
npm run format -- --check
```

### 6. Debugging

**Browser DevTools:**
1. Open Chrome/Firefox DevTools (F12)
2. Sources tab → see source maps
3. Console tab → see logs and errors
4. Network tab → see API requests

**React DevTools:**
1. Install React DevTools extension
2. Open DevTools
3. Components tab → inspect React tree
4. Profiler tab → performance analysis

**Console Logging:**
```typescript
console.log('Debug info:', variable);
console.error('Error:', error);
console.warn('Warning:', warning);
```

**Debug Mode:**
Set `REACT_APP_ENABLE_DEBUG=true` in `.env` for verbose logging

## Building for Production

### 1. Production Build

```bash
# Build for production
npm run build
```

**Output:**
```
vite v4.x.x building for production...
✓ xxx modules transformed.
dist/index.html                  x.xx kB
dist/assets/index-abc123.js      xxx.xx kB │ gzip: xx.xx kB
dist/assets/index-def456.css     xx.xx kB │ gzip: x.xx kB
✓ built in x.xxs
```

**Build artifacts:**
- Location: `dist/` folder
- Contents: HTML, JS chunks, CSS, assets
- Optimized: Minified, tree-shaken, compressed

### 2. Preview Production Build

```bash
# Preview production build locally
npm run preview
```

Access at: http://localhost:4173

### 3. Build Analysis

```bash
# Analyze bundle size (if configured)
npm run build -- --analyze
```

### 4. Build Optimization Tips

**Environment Variables:**
```bash
# Build with production API URL
REACT_APP_API_URL=https://api.production.com npm run build
```

**Build Performance:**
- Initial bundle: ~200 KB (gzipped)
- Total application: ~1.5 MB (all chunks)
- Lazy loading: Routes loaded on demand

## IDE Setup

### Visual Studio Code (Recommended)

**Required Extensions:**
1. **ESLint** (dbaeumer.vscode-eslint)
   - Real-time linting
   - Auto-fix on save

2. **Prettier** (esbenp.prettier-vscode)
   - Code formatting
   - Format on save

3. **TypeScript and JavaScript** (built-in)
   - IntelliSense
   - Type checking

**Recommended Extensions:**
4. **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)
   - React snippets (rafce, useState, etc.)

5. **Auto Rename Tag** (formulahendry.auto-rename-tag)
   - Auto-rename paired HTML/JSX tags

6. **Path Intellisense** (christian-kohler.path-intellisense)
   - Auto-complete file paths

7. **GitLens** (eamodio.gitlens)
   - Advanced Git integration

**VSCode Settings:**

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "node_modules": true,
    "dist": true
  }
}
```

**VSCode Launch Configuration:**

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### WebStorm / IntelliJ IDEA

**Configuration:**
1. File → Settings → Languages & Frameworks → JavaScript
2. JavaScript language version: React JSX
3. Code Quality Tools → ESLint: Enable
4. Code Quality Tools → Prettier: Enable
5. Node.js and NPM: Configure Node interpreter

## Troubleshooting

### Development Server Issues

**Port Already in Use:**
```bash
# Error: Port 5173 is already in use
# Solution: Use different port
npm run dev -- --port 3001
```

**Cannot Access from Network:**
```bash
# Solution: Expose to network
npm run dev -- --host 0.0.0.0
```

**Slow HMR:**
```bash
# Solution: Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Dependency Issues

**Installation Failures:**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Version Conflicts:**
```bash
# Solution: Check for peer dependency warnings
npm install --legacy-peer-deps
```

**Missing Types:**
```bash
# Solution: Install type definitions
npm install --save-dev @types/node @types/react @types/react-dom
```

### Build Issues

**Build Failures:**
```bash
# Solution: Clear dist folder and rebuild
rm -rf dist
npm run build
```

**TypeScript Errors:**
```bash
# Check for type errors
npm run type-check

# Fix common issues
# - Add missing type imports
# - Fix any type assertions
# - Check tsconfig.json configuration
```

**Memory Issues:**
```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Runtime Issues

**API Connection Errors:**
```bash
# Check:
# 1. Backend is running
# 2. REACT_APP_API_URL is correct in .env
# 3. CORS is configured on backend
# 4. Network connectivity
```

**Authentication Issues:**
```bash
# Solution: Clear browser storage
# 1. Open DevTools
# 2. Application tab
# 3. Clear localStorage and sessionStorage
# 4. Refresh page
```

**Routing Issues:**
```bash
# 404 on page refresh:
# - Configure server to serve index.html for all routes
# - Use HashRouter instead of BrowserRouter (not recommended)
```

## Common Issues

### Issue: White Screen / Blank Page

**Symptoms:** Browser shows white screen, no errors in console

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify API URL in `.env`
3. Check network requests in DevTools
4. Clear browser cache and refresh
5. Check backend is running and accessible

### Issue: Slow Performance

**Symptoms:** Application is slow, laggy interactions

**Solutions:**
1. Check browser DevTools → Performance tab
2. Verify production build is optimized
3. Check for memory leaks in components
4. Review large data rendering (use virtualization)
5. Check API response times

### Issue: Hot Reload Not Working

**Symptoms:** Changes not reflected automatically

**Solutions:**
1. Check file is saved
2. Restart development server
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Check file is in `src/` directory
5. Verify IDE isn't interfering with file watching

### Issue: Import Errors

**Symptoms:** Cannot find module errors

**Solutions:**
1. Check file path is correct (case-sensitive)
2. Verify file has correct extension (.ts, .tsx)
3. Check barrel exports in index.ts files
4. Restart TypeScript server in IDE
5. Run `npm install` again

### Issue: Environment Variables Not Working

**Symptoms:** Environment variables are undefined

**Solutions:**
1. Verify `.env` file exists
2. Check variables start with `REACT_APP_`
3. Restart development server after changing .env
4. Variables must be present at build time
5. Check `import.meta.env.REACT_APP_*` syntax

### Issue: Styling Issues

**Symptoms:** Styles not applied, layout broken

**Solutions:**
1. Check Ant Design CSS is imported
2. Verify global CSS in `index.css` is loaded
3. Check CSS module naming
4. Clear browser cache
5. Check for CSS conflicts

## Next Steps

After successful setup:

1. **Familiarize with Codebase:**
   - Review `README.md` for architecture overview
   - Explore `src/` directory structure
   - Check component documentation in .md files

2. **Start Development:**
   - Pick a task/feature
   - Create feature branch
   - Implement changes
   - Test locally
   - Submit pull request

3. **Join Team Communication:**
   - Access team chat/Slack
   - Review coding standards
   - Check project board for tasks

4. **Learn the Tech Stack:**
   - React 18 documentation
   - TypeScript handbook
   - Ant Design components
   - Vite documentation

## Additional Resources

**Official Documentation:**
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs/
- Vite: https://vitejs.dev
- Ant Design: https://ant.design
- React Router: https://reactrouter.com

**Learning Resources:**
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app
- Ant Design Pro: https://pro.ant.design (reference implementation)

**Tools:**
- React DevTools: https://react.dev/learn/react-developer-tools
- Redux DevTools: https://github.com/reduxjs/redux-devtools

## Support

For issues or questions:
1. Check this setup guide
2. Review README.md and step documentation
3. Search existing issues on GitHub
4. Ask team members
5. Create new issue with details

---

**Setup Complete!** You should now have a fully functional development environment for the Banking Reconciliation SaaS frontend.

Happy coding! 🚀
