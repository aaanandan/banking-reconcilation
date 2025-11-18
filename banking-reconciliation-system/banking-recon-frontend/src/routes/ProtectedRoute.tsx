/**
 * Protected Route Component
 *
 * Handles authentication and authorization for protected routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { isAuthenticated, getStoredUser } from '../utils/authUtils';
import { ROUTES, hasRouteAccess } from './routes';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresEmailVerification?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = true,
  requiresEmailVerification = false,
  allowedRoles,
  redirectTo,
}) => {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getStoredUser();

  // Check authentication
  if (requiresAuth && !authenticated) {
    // Redirect to login, preserving the intended destination
    return (
      <Navigate
        to={redirectTo || ROUTES.LOGIN}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check email verification
  if (requiresEmailVerification && user && !user.emailVerified) {
    return (
      <Result
        status="warning"
        title="Email Verification Required"
        subTitle="Please verify your email address to access this page."
        icon={<UserOutlined />}
        extra={[
          <Button type="primary" key="resend">
            Resend Verification Email
          </Button>,
          <Button key="logout" onClick={() => {
            // Implement logout
            window.location.href = ROUTES.LOGIN;
          }}>
            Sign Out
          </Button>,
        ]}
      />
    );
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <Result
          status="403"
          title="Access Denied"
          subTitle="You don't have permission to access this page."
          icon={<LockOutlined />}
          extra={[
            <Button type="primary" key="dashboard" href={ROUTES.DASHBOARD}>
              Go to Dashboard
            </Button>,
          ]}
        />
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

/**
 * Loading Route Component
 *
 * Shows loading spinner while route component is being loaded (lazy loading)
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Spin size="large" tip="Loading..." />
    </div>
  );
};
