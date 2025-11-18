/**
 * Registration Page Component
 *
 * Multi-step registration flow:
 * 1. Company Info
 * 2. User Details
 * 3. Email Verification
 */

import React, { useState } from 'react';
import { Card, Row, Col, Steps, Typography, Divider } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CompanyInfoStep } from './CompanyInfoStep';
import { UserDetailsStep } from './UserDetailsStep';
import { EmailVerificationStep, VerificationSuccess } from './EmailVerificationStep';
import {
  CompanyInfo,
  UserDetails,
  RegistrationData,
  storeTokens,
  storeUser,
  getAuthErrorMessage,
  AuthErrorCode,
} from '../../utils/authUtils';

const { Title, Text, Link } = Typography;

export interface RegisterProps {
  onRegister?: (data: RegistrationData) => Promise<any>;
  onVerifyEmail?: (email: string, code: string) => Promise<any>;
  onResendCode?: (email: string) => Promise<void>;
}

export const Register: React.FC<RegisterProps> = ({
  onRegister,
  onVerifyEmail,
  onResendCode,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Form data
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Handle company info submission (Step 1)
  const handleCompanyInfoNext = (data: CompanyInfo) => {
    setCompanyInfo(data);
    setCurrentStep(1);
    setError(null);
  };

  // Handle user details submission (Step 2)
  const handleUserDetailsNext = async (data: UserDetails) => {
    setLoading(true);
    setError(null);
    setUserDetails(data);

    try {
      const registrationData: RegistrationData = {
        companyInfo: companyInfo!,
        userDetails: data,
      };

      if (onRegister) {
        // Use custom registration handler
        await onRegister(registrationData);
      } else {
        // Mock registration for development
        console.log('Registration data:', registrationData);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock: Send verification email
        console.log(`Verification email sent to: ${data.email}`);
      }

      // Move to email verification step
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Registration error:', err);

      // Handle different error types
      if (err.response?.status === 409) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError(getAuthErrorMessage(AuthErrorCode.NETWORK_ERROR));
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle user details back button (Step 2 → Step 1)
  const handleUserDetailsBack = () => {
    setCurrentStep(0);
    setError(null);
  };

  // Handle email verification (Step 3)
  const handleVerifyEmail = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      if (onVerifyEmail && userDetails) {
        // Use custom verification handler
        const response = await onVerifyEmail(userDetails.email, code);

        // Store tokens and user data
        storeTokens(response.tokens, false);
        storeUser(response.user);

        // Show success state
        setVerified(true);
      } else {
        // Mock verification for development
        console.log(`Verifying code: ${code} for ${userDetails?.email}`);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock success
        const mockResponse = {
          user: {
            id: '1',
            email: userDetails!.email,
            firstName: userDetails!.firstName,
            lastName: userDetails!.lastName,
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

        storeTokens(mockResponse.tokens, false);
        storeUser(mockResponse.user);
        setVerified(true);
      }
    } catch (err: any) {
      console.error('Verification error:', err);

      // Handle different error types
      if (err.response?.status === 400) {
        setError('Invalid verification code. Please check and try again.');
      } else if (err.response?.status === 410) {
        setError('Verification code has expired. Please request a new code.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (onResendCode && userDetails) {
      await onResendCode(userDetails.email);
    } else {
      // Mock resend
      console.log(`Resending code to: ${userDetails?.email}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  // Handle continue after successful verification
  const handleContinue = () => {
    navigate('/dashboard');
  };

  // Handle login navigation
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  // Steps configuration
  const steps = [
    {
      title: 'Company',
      description: 'Company information',
    },
    {
      title: 'User',
      description: 'Account details',
    },
    {
      title: 'Verify',
      description: 'Email verification',
    },
  ];

  return (
    <div
      className="register-page"
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
        <Col xs={24} sm={22} md={20} lg={16} xl={14}>
          <Card
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              borderRadius: 12,
            }}
          >
            {/* Logo and Title */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <BankOutlined
                style={{
                  fontSize: 48,
                  color: '#1890ff',
                  marginBottom: 16,
                }}
              />
              <Title level={2} style={{ marginBottom: 8 }}>
                {verified ? 'Welcome!' : 'Create your account'}
              </Title>
              {!verified && (
                <Text type="secondary" style={{ fontSize: 16 }}>
                  Get started with Banking Reconciliation in minutes
                </Text>
              )}
            </div>

            {/* Steps Progress */}
            {!verified && (
              <div style={{ marginBottom: 32 }}>
                <Steps current={currentStep} items={steps} />
              </div>
            )}

            {/* Step Content */}
            {!verified && (
              <div>
                {currentStep === 0 && (
                  <CompanyInfoStep
                    initialValues={companyInfo || undefined}
                    onNext={handleCompanyInfoNext}
                    loading={loading}
                  />
                )}

                {currentStep === 1 && (
                  <UserDetailsStep
                    initialValues={userDetails || undefined}
                    onNext={handleUserDetailsNext}
                    onBack={handleUserDetailsBack}
                    loading={loading}
                  />
                )}

                {currentStep === 2 && userDetails && (
                  <EmailVerificationStep
                    email={userDetails.email}
                    onVerify={handleVerifyEmail}
                    onResendCode={handleResendCode}
                    loading={loading}
                    error={error}
                  />
                )}
              </div>
            )}

            {/* Success State */}
            {verified && userDetails && (
              <VerificationSuccess email={userDetails.email} onContinue={handleContinue} />
            )}

            {/* Login Link */}
            {!verified && (
              <>
                <Divider style={{ margin: '24px 0 16px 0' }} />
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">
                    Already have an account?{' '}
                    <Link onClick={handleLoginClick} disabled={loading}>
                      Sign in
                    </Link>
                  </Text>
                </div>
              </>
            )}

            {/* Footer */}
            {!verified && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                </Text>
              </div>
            )}
          </Card>

          {/* Demo Verification Code (Development Only) */}
          {process.env.NODE_ENV === 'development' && currentStep === 2 && !verified && (
            <Card
              size="small"
              style={{
                marginTop: 16,
                backgroundColor: '#fffbe6',
                borderColor: '#ffe58f',
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Demo Verification Code:
              </Text>
              <br />
              <Text style={{ fontSize: 12 }}>123456</Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};
