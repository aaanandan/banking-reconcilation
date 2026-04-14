/**
 * Email Verification Step Component
 *
 * Third step of registration: Verify email with 6-digit code
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Typography, Alert, Result } from 'antd';
import {
  MailOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { validateVerificationCode, formatVerificationCode } from '../../utils/authUtils';

const { Title, Text, Link } = Typography;

export interface EmailVerificationStepProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResendCode?: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  onVerify,
  onResendCode,
  loading = false,
  error,
}) => {
  const [form] = Form.useForm();
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (values: any) => {
    const code = values.code.replace(/[\s-]/g, '');
    await onVerify(code);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    try {
      if (onResendCode) {
        await onResendCode();
      }
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      console.error('Resend error:', err);
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[\s-]/g, '');
    // Only allow numbers
    value = value.replace(/[^\d]/g, '');
    // Limit to 6 digits
    value = value.slice(0, 6);
    // Format as XXX-XXX
    const formatted = formatVerificationCode(value);
    setVerificationCode(formatted);
    form.setFieldsValue({ code: formatted });

    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      form.submit();
    }
  };

  return (
    <div className="email-verification-step">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <SafetyOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3}>Verify your email</Title>
          <Text type="secondary">
            We've sent a 6-digit verification code to:
            <br />
            <Text strong>{email}</Text>
          </Text>
        </div>

        {/* Info Alert */}
        <Alert
          message="Check your inbox"
          description="The code will expire in 15 minutes. If you don't see the email, check your spam folder."
          type="info"
          showIcon
          icon={<MailOutlined />}
        />

        {/* Error Alert */}
        {error && (
          <Alert message={error} type="error" showIcon closable />
        )}

        {/* Form */}
        <Form
          form={form}
          name="email-verification"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          {/* Verification Code */}
          <Form.Item
            name="code"
            label="Verification Code"
            rules={[
              { required: true, message: 'Please enter the verification code' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const validation = validateVerificationCode(value);
                  if (!validation.valid) {
                    throw new Error(validation.error);
                  }
                },
              },
            ]}
          >
            <Input
              placeholder="000-000"
              disabled={loading}
              maxLength={7} // 6 digits + 1 dash
              value={verificationCode}
              onChange={handleCodeChange}
              style={{
                fontSize: 24,
                letterSpacing: 4,
                textAlign: 'center',
                fontWeight: 500,
              }}
              autoFocus
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              icon={<CheckCircleOutlined />}
              loading={loading}
              style={{ height: 48, fontSize: 16, fontWeight: 500 }}
            >
              Verify Email
            </Button>
          </Form.Item>
        </Form>

        {/* Resend Code */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Didn't receive the code?{' '}
            {resendCooldown > 0 ? (
              <Text type="secondary">Resend in {resendCooldown}s</Text>
            ) : (
              <Link onClick={handleResendCode} disabled={resending}>
                <ReloadOutlined spin={resending} /> Resend code
              </Link>
            )}
          </Text>
        </div>

        {/* Help Text */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Need help?{' '}
            <Link href="/support" target="_blank">
              Contact support
            </Link>
          </Text>
        </div>
      </Space>
    </div>
  );
};

// Success Result Component (shown after successful verification)
export interface VerificationSuccessProps {
  email: string;
  onContinue: () => void;
}

export const VerificationSuccess: React.FC<VerificationSuccessProps> = ({ email, onContinue }) => {
  return (
    <Result
      status="success"
      title="Email verified successfully!"
      subTitle={`Your email ${email} has been verified. You can now access your account.`}
      extra={[
        <Button type="primary" size="large" onClick={onContinue} key="continue">
          Continue to Dashboard
        </Button>,
      ]}
    />
  );
};
