import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Steps, Alert } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';

const { Title, Text } = Typography;

interface CompanyFormValues {
  companyName: string;
  companyEmail: string;
}

interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [companyData, setCompanyData] = useState<CompanyFormValues | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompanySubmit = (values: CompanyFormValues) => {
    setCompanyData(values);
    setCurrentStep(1);
  };

  const handleUserSubmit = async (values: UserFormValues) => {
    if (!companyData) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.register({
        companyName: companyData.companyName,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      setCurrentStep(2);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Company Info' },
    { title: 'User Details' },
    { title: 'Verification' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 4 }}>
            Create Account
          </Title>
          <Text type="secondary">Start your free trial today</Text>
        </div>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        {currentStep === 0 && (
          <Form layout="vertical" onFinish={handleCompanySubmit} size="large">
            <Form.Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter your company name' }]}
            >
              <Input prefix={<BankOutlined />} placeholder="Acme Corporation" />
            </Form.Item>
            <Form.Item
              name="companyEmail"
              label="Company Email"
              rules={[
                { required: true, message: 'Please enter company email' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="contact@acme.com" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Continue
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form layout="vertical" onFinish={handleUserSubmit} size="large">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="John" />
              </Form.Item>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Doe" />
              </Form.Item>
            </div>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="john@acme.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Required' },
                { min: 8, message: 'At least 8 characters' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Secure password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setCurrentStep(0)} block>
                Back
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Create Account
              </Button>
            </div>
          </Form>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <MailOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={3}>Check your email</Title>
            <Text type="secondary">
              We sent a verification link to your email. Please verify before logging in.
            </Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          </div>
        )}

        {currentStep !== 2 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">Already have an account? </Text>
            <Link to="/login">Sign in</Link>
          </div>
        )}
      </Card>
    </div>
  );
};
