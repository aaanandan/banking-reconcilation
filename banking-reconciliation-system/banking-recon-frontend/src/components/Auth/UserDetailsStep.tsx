/**
 * User Details Step Component
 *
 * Second step of registration: Collect user personal details and credentials
 */

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Space, Typography, Progress } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  UserDetails,
  validateFirstName,
  validateLastName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  checkPasswordStrength,
  PasswordStrength,
} from '../../utils/authUtils';

const { Title, Text, Link } = Typography;

export interface UserDetailsStepProps {
  initialValues?: Partial<UserDetails>;
  onNext: (data: UserDetails) => void;
  onBack: () => void;
  loading?: boolean;
}

export const UserDetailsStep: React.FC<UserDetailsStepProps> = ({
  initialValues,
  onNext,
  onBack,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = (values: any) => {
    const userDetails: UserDetails = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      acceptedTerms: values.acceptedTerms || false,
    };

    onNext(userDetails);
  };

  return (
    <div className="user-details-step">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>Create your account</Title>
          <Text type="secondary">
            Enter your personal details to set up your administrator account.
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          name="user-details"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          initialValues={initialValues}
          autoComplete="off"
        >
          {/* First Name */}
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'Please enter your first name' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const validation = validateFirstName(value);
                  if (!validation.valid) {
                    throw new Error(validation.error);
                  }
                },
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="John"
              disabled={loading}
              maxLength={50}
              autoComplete="given-name"
            />
          </Form.Item>

          {/* Last Name */}
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: 'Please enter your last name' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const validation = validateLastName(value);
                  if (!validation.valid) {
                    throw new Error(validation.error);
                  }
                },
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Doe"
              disabled={loading}
              maxLength={50}
              autoComplete="family-name"
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const validation = validateEmail(value);
                  if (!validation.valid) {
                    throw new Error(validation.error);
                  }
                },
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="you@company.com"
              disabled={loading}
              autoComplete="email"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter a password' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const validation = validatePassword(value);
                  if (!validation.valid) {
                    throw new Error(validation.error);
                  }
                },
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Create a strong password"
              disabled={loading}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
          </Form.Item>

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div style={{ marginTop: -16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12 }}>Password Strength:</Text>
                <Text style={{ fontSize: 12, color: passwordStrength.color, fontWeight: 500 }}>
                  {passwordStrength.label}
                </Text>
              </div>
              <Progress
                percent={(passwordStrength.score / 4) * 100}
                strokeColor={passwordStrength.color}
                showInfo={false}
                size="small"
              />
              {passwordStrength.feedback.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {passwordStrength.feedback.map((feedback, index) => (
                    <div key={index} style={{ fontSize: 12, color: '#888' }}>
                      • {feedback}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confirm Password */}
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const password = getFieldValue('password');
                  const validation = validatePasswordConfirmation(password, value);
                  if (!validation.valid) {
                    return Promise.reject(new Error(validation.error));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Re-enter your password"
              disabled={loading}
              autoComplete="new-password"
            />
          </Form.Item>

          {/* Terms Acceptance */}
          <Form.Item
            name="acceptedTerms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('You must accept the Terms of Service')),
              },
            ]}
          >
            <Checkbox disabled={loading}>
              I accept the{' '}
              <Link href="/terms" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank">
                Privacy Policy
              </Link>
            </Checkbox>
          </Form.Item>

          {/* Action Buttons */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                disabled={loading}
                size="large"
              >
                Back
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<ArrowRightOutlined />}
                loading={loading}
                size="large"
                style={{ fontWeight: 500 }}
                iconPosition="end"
              >
                Create Account
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </div>
  );
};
