/**
 * Main Application Component
 *
 * Integrates routing, layout, authentication, and global providers
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { ProtectedRoute, ROUTES } from './routes';
import { MainLayout } from './components/Layout';
import { isAuthenticated } from './utils/authUtils';

// Lazy load page components
const Login = React.lazy(() => import('./components/Auth/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./components/Auth/Register').then(m => ({ default: m.Register })));
const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const MultiUpload = React.lazy(() => import('./components/Upload/MultiUpload').then(m => ({ default: m.MultiUpload })));
const ColumnMapping = React.lazy(() => import('./components/ColumnMapping/ColumnMapping').then(m => ({ default: m.ColumnMapping })));
const DateRangeSelector = React.lazy(() => import('./components/DateRange/DateRangeSelector').then(m => ({ default: m.DateRangeSelector })));
const TransactionReview = React.lazy(() => import('./components/TransactionReview/TransactionReview').then(m => ({ default: m.TransactionReview })));
const MatchApproval = React.lazy(() => import('./components/MatchApproval/MatchApproval').then(m => ({ default: m.MatchApproval })));
const UnmatchedPool = React.lazy(() => import('./components/UnmatchedPool/UnmatchedPool').then(m => ({ default: m.UnmatchedPool })));
const LearningQuestions = React.lazy(() => import('./components/LearningQuestions/LearningQuestions').then(m => ({ default: m.LearningQuestions })));
const EntityProfiles = React.lazy(() => import('./components/EntityProfiles/EntityProfiles').then(m => ({ default: m.EntityProfiles })));
const ReportsManager = React.lazy(() => import('./components/Reports/ReportsManager').then(m => ({ default: m.ReportsManager })));
const SettingsManager = React.lazy(() => import('./components/Settings/SettingsManager').then(m => ({ default: m.SettingsManager })));
const UsersManager = React.lazy(() => import('./components/UserManagement/UsersManager').then(m => ({ default: m.UsersManager })));
const HelpCenter = React.lazy(() => import('./components/Help/HelpCenter').then(m => ({ default: m.HelpCenter })));

/**
 * Loading Fallback Component
 */
const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f0f2f5',
    }}
  >
    <Spin size="large" tip="Loading..." />
  </div>
);

/**
 * Public Routes Component
 */
const PublicRoutes: React.FC = () => {
  const authenticated = isAuthenticated();

  // Redirect to dashboard if already authenticated
  if (authenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

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
 */
const ProtectedRoutes: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        {/* Dashboard */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

        {/* Upload Flow */}
        <Route path={ROUTES.RECONCILIATION.NEW} element={<MultiUpload />} />
        <Route path={ROUTES.RECONCILIATION.MAPPING} element={<ColumnMapping />} />
        <Route path={ROUTES.RECONCILIATION.DATE_RANGE} element={<DateRangeSelector />} />

        {/* Review Flow */}
        <Route path={ROUTES.RECONCILIATION.REVIEW} element={<TransactionReview />} />
        <Route path={ROUTES.RECONCILIATION.MATCH} element={<MatchApproval />} />
        <Route path={ROUTES.RECONCILIATION.UNMATCHED} element={<UnmatchedPool />} />

        {/* Learning */}
        <Route path={ROUTES.LEARNING.QUESTIONS} element={<LearningQuestions />} />
        <Route path={ROUTES.LEARNING.PROFILES} element={<EntityProfiles />} />

        {/* Management */}
        <Route path={ROUTES.REPORTS} element={<ReportsManager />} />
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
        <Route path={ROUTES.HELP} element={<HelpCenter />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </MainLayout>
  );
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  const authenticated = isAuthenticated();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontSize: 14,
        },
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path={`${ROUTES.LOGIN}/*`}
              element={<PublicRoutes />}
            />
            <Route
              path={`${ROUTES.REGISTER}/*`}
              element={<PublicRoutes />}
            />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                authenticated ? (
                  <ProtectedRoutes />
                ) : (
                  <Navigate to={ROUTES.LOGIN} replace />
                )
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
