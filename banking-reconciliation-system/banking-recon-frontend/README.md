# Banking Reconciliation SaaS - Frontend Application

A comprehensive React-based frontend for the Banking Reconciliation SaaS platform with intelligent transaction matching, learning capabilities, and multi-tenant support.

## 🎯 Overview

This frontend application provides a complete user interface for banking reconciliation operations, including:
- Multi-bank file upload and processing
- Intelligent transaction matching with confidence scoring
- Human reasoning layer (HRL) for learning entity patterns
- Match review and approval workflows
- Unmatched transaction management
- Reports and analytics
- User and settings management
- Help and documentation center

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend documentation)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd banking-reconciliation-system/banking-recon-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL
# REACT_APP_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Output will be in dist/ folder
```

## 📁 Project Structure

```
src/
├── api/                      # API integration layer
│   ├── apiClient.ts         # Axios client with auth interceptors
│   ├── modules.ts           # Feature-specific API endpoints
│   ├── types.ts             # API request/response types
│   └── index.ts             # Barrel exports
├── components/               # React components
│   ├── Auth/                # Authentication (Login, Register)
│   ├── Dashboard/           # Main dashboard
│   ├── Upload/              # Multi-bank file upload
│   ├── ColumnMapping/       # Column mapping wizard
│   ├── DateRange/           # Date range selection
│   ├── TransactionReview/   # Transaction review interface
│   ├── MatchApproval/       # Match approval workflow
│   ├── UnmatchedPool/       # Unmatched transaction management
│   ├── LearningQuestions/   # Learning questions interface
│   ├── EntityProfiles/      # Entity profile management
│   ├── Reports/             # Reports and analytics
│   ├── Settings/            # System settings
│   ├── UserManagement/      # User administration
│   ├── Help/                # Help center
│   └── Layout/              # Layout components (Header, Sidebar)
├── routes/                   # Routing configuration
│   ├── routes.ts            # Route definitions and helpers
│   ├── ProtectedRoute.tsx   # Authentication/authorization HOC
│   ├── AppRouter.tsx        # Main router component
│   └── index.ts             # Barrel exports
├── utils/                    # Utility functions
│   ├── authUtils.ts         # Authentication utilities
│   ├── uploadUtils.ts       # File upload utilities
│   ├── dateRangeUtils.ts    # Date range utilities
│   └── ...                  # Other feature utilities
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

## 🎨 Features

### Authentication & Authorization
- Email/password authentication
- SSO support (Google, Microsoft)
- Multi-step registration with email verification
- Role-based access control (Admin, Manager, User, Viewer)
- Token refresh mechanism
- Remember me functionality

### Dashboard
- Key metrics and statistics
- Recent activity timeline
- Quick actions for common tasks
- Trend indicators

### Reconciliation Workflow

**1. Multi-Bank Upload**
- Upload 1-3 bank statement files
- Upload 1 ledger file
- Support for CSV, Excel, PDF formats
- File validation and preview
- Drag-and-drop interface

**2. Column Mapping**
- Interactive column mapping wizard
- Per-file configuration
- Data preview
- Template saving

**3. Date Range Selection** (Optional)
- 10 preset options (This Month, Last Quarter, etc.)
- Custom date range picker
- Transaction filtering
- Coverage statistics

**4. Transaction Review**
- View all transactions with filters
- Confidence-based sorting
- Match status indicators
- Bulk operations

**5. Match Approval**
- Review match details
- Approve/reject matches
- View alternative matches
- Override with manual matching

**6. Unmatched Pool**
- View unmatched transactions
- Manual matching
- Bulk actions
- Export capabilities

### Learning & Intelligence

**Learning Questions**
- Pending question queue
- Priority-based sorting
- Context display
- Answer with feedback

**Entity Profiles**
- Learned entity patterns
- Transaction history
- Pattern insights
- Manual editing

### Management

**Reports & Analytics**
- 7 report types
- 4 export formats (PDF, Excel, CSV, JSON)
- Date range filtering
- Download and scheduling

**Settings**
- 7 configuration categories
- General, Reconciliation, Learning
- Notifications, Integrations, Security, Data
- Validation and reset

**User Management** (Admin only)
- User list with filtering
- Invite new users
- Role assignment
- Status management

**Help & Documentation**
- Getting started guides
- Help articles
- FAQs
- Video tutorials
- Search functionality

## 🛠 Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v6** - Routing

### UI Components
- **Ant Design 5** - Component library
- **Ant Design Icons** - Icon set

### API & Data
- **Axios** - HTTP client
- **Day.js** - Date manipulation

### Development
- **ESLint** - Linting
- **Prettier** - Code formatting

## 🔒 Authentication Flow

1. **Login** → Credentials validated → Tokens stored → Navigate to dashboard
2. **Token Refresh** → 401 response → Refresh token → Retry request
3. **Logout** → Clear tokens → Navigate to login
4. **Protected Routes** → Check authentication → Allow/redirect

## 🎭 Role-Based Access

| Route | Admin | Manager | User | Viewer |
|-------|-------|---------|------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Reconciliations | ✅ | ✅ | ✅ | ✅ |
| Learning | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ |
| Help | ✅ | ✅ | ✅ | ✅ |

## 📊 Performance

### Optimizations
- **Code Splitting**: All routes lazy-loaded (~70% reduction in initial bundle)
- **Tree Shaking**: Unused code eliminated
- **Memoization**: Expensive calculations cached
- **Virtual Scrolling**: Large lists optimized

### Bundle Sizes (approximate)
- Initial bundle: ~200 KB (gzipped)
- Total application: ~1.5 MB (all chunks)
- Average chunk: ~50-150 KB

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_TIMEOUT=30000

# Application
REACT_APP_NAME=Banking Reconciliation
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=false
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/` folder ready for deployment.

### Deployment Options

**Static Hosting:**
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

**Docker:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Environment Variables in Production:**
```bash
REACT_APP_API_URL=https://api.production.com npm run build
```

## 📝 API Integration

### API Modules

The application includes 10 feature-specific API modules:

1. **authApi** - Authentication endpoints
2. **reconciliationApi** - Reconciliation management
3. **transactionApi** - Transaction operations
4. **matchApi** - Match approval and management
5. **learningApi** - Learning questions and profiles
6. **reportsApi** - Report generation
7. **settingsApi** - System settings
8. **usersApi** - User management
9. **helpApi** - Help and documentation
10. **dashboardApi** - Dashboard statistics

### Usage Example

```typescript
import { reconciliationApi } from './api';

// Fetch reconciliations
const response = await reconciliationApi.list({
  page: 1,
  pageSize: 10,
});

console.log(response.data);
```

## 🎨 Theming

The application uses Ant Design's theming system:

```typescript
{
  token: {
    colorPrimary: '#1890ff',    // Primary blue
    borderRadius: 6,             // Rounded corners
    fontSize: 14,                // Base font size
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**API Connection Errors:**
- Check `REACT_APP_API_URL` in `.env`
- Ensure backend is running
- Check CORS configuration on backend

**Authentication Issues:**
- Clear localStorage/sessionStorage
- Check token expiration
- Verify refresh token mechanism

**Build Errors:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (18+)

## 📚 Documentation

Detailed documentation for each step of development:
- `STEP_121_*.md` through `STEP_139_*.md` - Individual feature documentation
- `STEP_140_FRONTEND_COMPLETE.md` - Frontend completion summary

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checking
4. Submit a pull request

## 📄 License

[Your License Here]

## 👥 Team

[Your Team Information]

## 🔗 Links

- [Backend Repository](#)
- [API Documentation](#)
- [Design System](#)
- [User Guide](#)

---

**Built with ❤️ using React, TypeScript, and Ant Design**
