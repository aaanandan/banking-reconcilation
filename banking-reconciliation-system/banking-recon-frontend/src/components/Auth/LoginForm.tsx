/**
 * Login Form Component
 *
 * Email/password login form with validation and remember me option
 */

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Space, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import {
  LoginCredentials,
  validateEmail,
  validatePassword,
  validateLoginCredentials,
} from '../../utils/authUtils';

const { Link } = Typography;

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error,
  onForgotPassword,
}) => {
  const [form] = Form.useForm();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    setValidationError(null);

    const credentials: LoginCredentials = {
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe || false,
    };

    // Validate credentials
    const validation = validateLoginCredentials(credentials);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setValidationError(firstError);
      return;
    }

    try {
      await onSubmit(credentials);
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  return (
    <div className="login-form">
      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        {/* Error Alert */}
        {(error || validationError) && (
          <Form.Item>
            <Alert
              message={error || validationError}
              type="error"
              showIcon
              closable
              onClose={() => setValidationError(null)}
            />
          </Form.Item>
        )}

        {/* Email Field */}
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
            autoComplete="email"
            disabled={loading}
          />
        </Form.Item>

        {/* Password Field */}
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter your password' },
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
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
          />
        </Form.Item>

        {/* Remember Me & Forgot Password */}
        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Form.Item name="rememberMe" valuePropName="checked" noStyle>
              <Checkbox disabled={loading}>Remember me</Checkbox>
            </Form.Item>
            <Link onClick={handleForgotPassword} disabled={loading}>
              Forgot password?
            </Link>
          </div>
        </Form.Item>

        {/* Submit Button */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            icon={<LoginOutlined />}
            loading={loading}
            style={{ height: 48, fontSize: 16, fontWeight: 500 }}
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
