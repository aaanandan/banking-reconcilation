/**
 * Application Router
 *
 * Defines all application routes and route configuration
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RouteLoadingFallback } from './ProtectedRoute';
import { ROUTES } from './routes';

// ==================== LAZY LOADED COMPONENTS ====================

// Auth Pages
const Login = lazy(() => import('../components/Auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../components/Auth/Register').then(m => ({ default: m.Register })));

// Dashboard
const Dashboard = lazy(() => import('../components/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));

// Upload Flow
const MultiUpload = lazy(() => import('../components/Upload/MultiUpload').then(m => ({ default: m.MultiUpload })));
const ColumnMapping = lazy(() => import('../components/ColumnMapping/ColumnMapping').then(m => ({ default: m.ColumnMapping })));
const DateRangeSelector = lazy(() => import('../components/DateRange/DateRangeSelector').then(m => ({ default: m.DateRangeSelector })));

// Review Flow
const TransactionReview = lazy(() => import('../components/TransactionReview/TransactionReview').then(m => ({ default: m.TransactionReview })));
const MatchApproval = lazy(() => import('../components/MatchApproval/MatchApproval').then(m => ({ default: m.MatchApproval })));
const UnmatchedPool = lazy(() => import('../components/UnmatchedPool/UnmatchedPool').then(m => ({ default: m.UnmatchedPool })));

// Learning
const LearningQuestions = lazy(() => import('../components/LearningQuestions/LearningQuestions').then(m => ({ default: m.LearningQuestions })));
const EntityProfiles = lazy(() => import('../components/EntityProfiles/EntityProfiles').then(m => ({ default: m.EntityProfiles })));

// Management
const ReportsManager = lazy(() => import('../components/Reports/ReportsManager').then(m => ({ default: m.ReportsManager })));
const SettingsManager = lazy(() => import('../components/Settings/SettingsManager').then(m => ({ default: m.SettingsManager })));
const UsersManager = lazy(() => import('../components/UserManagement/UsersManager').then(m => ({ default: m.UsersManager })));
const HelpCenter = lazy(() => import('../components/Help/HelpCenter').then(m => ({ default: m.HelpCenter })));

// ==================== ROUTE COMPONENTS ====================

/**
 * Public Routes Component
 * Routes accessible without authentication
 */
const PublicRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};

/**
 * Protected Routes Component
 * Routes requiring authentication
 */
const ProtectedRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Dashboard */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Upload Flow */}
      <Route
        path={ROUTES.RECONCILIATION.NEW}
        element={
          <ProtectedRoute>
            <MultiUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECONCILIATION.MAPPING}
        element={
          <ProtectedRoute>
            <ColumnMapping />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECONCILIATION.DATE_RANGE}
        element={
          <ProtectedRoute>
            <DateRangeSelector />
          </ProtectedRoute>
        }
      />

      {/* Review Flow */}
      <Route
        path={ROUTES.RECONCILIATION.REVIEW}
        element={
          <ProtectedRoute>
            <TransactionReview />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECONCILIATION.MATCH}
        element={
          <ProtectedRoute>
            <MatchApproval />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.RECONCILIATION.UNMATCHED}
        element={
          <ProtectedRoute>
            <UnmatchedPool />
          </ProtectedRoute>
        }
      />

      {/* Learning */}
      <Route
        path={ROUTES.LEARNING.QUESTIONS}
        element={
          <ProtectedRoute>
            <LearningQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.LEARNING.PROFILES}
        element={
          <ProtectedRoute>
            <EntityProfiles />
          </ProtectedRoute>
        }
      />

      {/* Management */}
      <Route
        path={ROUTES.REPORTS}
        element={
          <ProtectedRoute>
            <ReportsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <SettingsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersManager />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.HELP}
        element={
          <ProtectedRoute>
            <HelpCenter />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
};

/**
 * Main App Router
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />

          {/* Protected Routes */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Upload Flow */}
          <Route
            path={ROUTES.RECONCILIATION.NEW}
            element={
              <ProtectedRoute>
                <MultiUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.RECONCILIATION.MAPPING}
            element={
              <ProtectedRoute>
                <ColumnMapping />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.RECONCILIATION.DATE_RANGE}
            element={
              <ProtectedRoute>
                <DateRangeSelector />
              </ProtectedRoute>
            }
          />

          {/* Review Flow */}
          <Route
            path={ROUTES.RECONCILIATION.REVIEW}
            element={
              <ProtectedRoute>
                <TransactionReview />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.RECONCILIATION.MATCH}
            element={
              <ProtectedRoute>
                <MatchApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.RECONCILIATION.UNMATCHED}
            element={
              <ProtectedRoute>
                <UnmatchedPool />
              </ProtectedRoute>
            }
          />

          {/* Learning */}
          <Route
            path={ROUTES.LEARNING.QUESTIONS}
            element={
              <ProtectedRoute>
                <LearningQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.LEARNING.PROFILES}
            element={
              <ProtectedRoute>
                <EntityProfiles />
              </ProtectedRoute>
            }
          />

          {/* Management */}
          <Route
            path={ROUTES.REPORTS}
            element={
              <ProtectedRoute>
                <ReportsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <SettingsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.USERS}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersManager />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.HELP}
            element={
              <ProtectedRoute>
                <HelpCenter />
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
