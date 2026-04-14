import React, { useEffect } from 'react';
import { Form, Input, Button, Checkbox, Typography, Space, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, WindowsOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slices/auth.slice';
import type { AppDispatch, RootState } from '../../store';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const onFinish = async (values: LoginFormValues) => {
    try {
      await dispatch(login({ email: values.email, password: values.password })).unwrap();
    } catch (err) {
      // Error is handled by Redux slice
      console.error('Login failed:', err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '40px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>Banking Reconciliation</Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
            />
          )}

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email address"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 45 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>Or continue with</Divider>

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button
              icon={<GoogleOutlined />}
              block
              disabled
              style={{ height: 45 }}
            >
              Sign in with Google
            </Button>
            <Button
              icon={<WindowsOutlined />}
              block
              disabled
              style={{ height: 45 }}
            >
              Sign in with Microsoft
            </Button>
          </Space>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Don't have an account? <Link to="/register">Sign up</Link>
            </Text>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default Login;
