/**
 * Login Page Component
 *
 * Full login page with:
 * - Branding and logo
 * - SSO buttons (Google, Microsoft)
 * - Email/password login form
 * - Registration link
 * - Responsive layout
 */

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Space, Divider } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { SSOButtons } from './SSOButtons';
import {
  LoginCredentials,
  SSOProvider,
  storeTokens,
  storeUser,
  getAuthErrorMessage,
  AuthErrorCode,
} from '../../utils/authUtils';

const { Title, Text, Link } = Typography;

export interface LoginProps {
  onLogin?: (credentials: LoginCredentials) => Promise<any>;
  onSSOLogin?: (provider: SSOProvider) => Promise<any>;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSSOLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle email/password login
  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      if (onLogin) {
        // Use custom login handler if provided
        const response = await onLogin(credentials);

        // Store tokens and user data
        storeTokens(response.tokens, credentials.rememberMe);
        storeUser(response.user);

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Mock login for development
        console.log('Login credentials:', credentials);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock successful login
        const mockResponse = {
          user: {
            id: '1',
            email: credentials.email,
            firstName: 'John',
            lastName: 'Doe',
            tenantId: 'tenant-1',
            role: 'admin',
            emailVerified: true,
            createdAt: new Date().toISOString(),
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          },
        };

        storeTokens(mockResponse.tokens, credentials.rememberMe);
        storeUser(mockResponse.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle different error types
      if (err.response?.status === 401) {
        setError(getAuthErrorMessage(AuthErrorCode.INVALID_CREDENTIALS));
      } else if (err.response?.status === 403) {
        setError(getAuthErrorMessage(AuthErrorCode.EMAIL_NOT_VERIFIED));
      } else if (err.code === 'NETWORK_ERROR') {
        setError(getAuthErrorMessage(AuthErrorCode.NETWORK_ERROR));
      } else {
        setError(err.message || getAuthErrorMessage(AuthErrorCode.UNKNOWN_ERROR));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle SSO login
  const handleSSOLogin = async (provider: SSOProvider) => {
    setLoading(true);
    setError(null);

    try {
      if (onSSOLogin) {
        await onSSOLogin(provider);
      } else {
        // Default: redirect to SSO provider
        // This is handled in SSOButtons component
      }
    } catch (err: any) {
      console.error('SSO login error:', err);
      setError(err.message || 'SSO login failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Handle register navigation
  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Row justify="center" style={{ width: '100%', maxWidth: 1200 }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              borderRadius: 12,
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Logo and Title */}
              <div style={{ textAlign: 'center' }}>
                <BankOutlined
                  style={{
                    fontSize: 48,
                    color: '#1890ff',
                    marginBottom: 16,
                  }}
                />
                <Title level={2} style={{ marginBottom: 8 }}>
                  Banking Reconciliation
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  Sign in to your account to continue
                </Text>
              </div>

              {/* SSO Buttons */}
              <SSOButtons onSSOClick={handleSSOLogin} loading={loading} />

              {/* Login Form */}
              <LoginForm
                onSubmit={handleLogin}
                loading={loading}
                error={error}
                onForgotPassword={handleForgotPassword}
              />

              {/* Registration Link */}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  Don't have an account?{' '}
                  <Link onClick={handleRegisterClick} disabled={loading}>
                    Sign up for free
                  </Link>
                </Text>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  By signing in, you agree to our{' '}
                  <Link href="/terms" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                </Text>
              </div>
            </Space>
          </Card>

          {/* Demo Credentials (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <Card
              size="small"
              style={{
                marginTop: 16,
                backgroundColor: '#fffbe6',
                borderColor: '#ffe58f',
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Demo Credentials:
              </Text>
              <br />
              <Text style={{ fontSize: 12 }}>
                Email: demo@example.com | Password: Demo1234!
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};
