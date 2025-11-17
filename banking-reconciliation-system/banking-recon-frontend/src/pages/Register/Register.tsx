import React, { useState } from 'react';
import { Form, Input, Button, Steps, Typography, Space, Card, Select, Alert, Result } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';

const { Title, Text } = Typography;
const { Step } = Steps;

interface CompanyInfoData {
  companyName: string;
  industry?: string;
}

interface UserDetailsData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegistrationData extends CompanyInfoData, UserDetailsData {}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RegistrationData>>({});

  const [companyForm] = Form.useForm();
  const [userForm] = Form.useForm();

  const steps = [
    {
      title: 'Company Info',
      icon: <BankOutlined />,
    },
    {
      title: 'User Details',
      icon: <UserOutlined />,
    },
    {
      title: 'Verification',
      icon: <CheckCircleOutlined />,
    },
  ];

  const handleCompanyInfoSubmit = async (values: CompanyInfoData) => {
    setFormData({ ...formData, ...values });
    setCurrentStep(1);
  };

  const handleUserDetailsSubmit = async (values: UserDetailsData) => {
    setFormData({ ...formData, ...values });
    setError(null);
    setLoading(true);

    try {
      const registrationData = {
        ...formData,
        ...values,
      };

      await authApi.register(registrationData);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form
            form={companyForm}
            name="company-info"
            onFinish={handleCompanyInfoSubmit}
            layout="vertical"
            size="large"
            initialValues={formData}
          >
            <Form.Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter your company name!' }]}
            >
              <Input
                prefix={<BankOutlined />}
                placeholder="Company name"
              />
            </Form.Item>

            <Form.Item
              name="industry"
              label="Industry (Optional)"
            >
              <Select
                placeholder="Select industry"
                allowClear
                options={[
                  { value: 'finance', label: 'Finance & Banking' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'manufacturing', label: 'Manufacturing' },
                  { value: 'technology', label: 'Technology' },
                  { value: 'healthcare', label: 'Healthcare' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button onClick={() => navigate('/login')}>
                  Back to Login
                </Button>
                <Button type="primary" htmlType="submit">
                  Next
                </Button>
              </Space>
            </Form.Item>
          </Form>
        );

      case 1:
        return (
          <Form
            form={userForm}
            name="user-details"
            onFinish={handleUserDetailsSubmit}
            layout="vertical"
            size="large"
            initialValues={formData}
          >
            {error && (
              <Alert
                message="Registration Failed"
                description={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 16 }}
                onClose={() => setError(null)}
              />
            )}

            <Space direction="horizontal" style={{ width: '100%' }} size="middle">
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter your first name!' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="First name"
                />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter your last name!' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Last name"
                />
              </Form.Item>
            </Space>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email address"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter your password!' },
                { min: 8, message: 'Password must be at least 8 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrentStep(0)}>
                  Previous
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Account
                </Button>
              </Space>
            </Form.Item>
          </Form>
        );

      case 2:
        return (
          <Result
            status="success"
            title="Registration Successful!"
            subTitle="Your account has been created. Please check your email to verify your account."
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/login')}>
                Go to Login
              </Button>,
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: 600,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>Create Account</Title>
            <Text type="secondary">Join Banking Reconciliation Platform</Text>
          </div>

          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            {steps.map((step, index) => (
              <Step key={index} title={step.title} icon={step.icon} />
            ))}
          </Steps>

          {renderStepContent()}

          {currentStep < 2 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">
                Already have an account? <Link to="/login">Sign in</Link>
              </Text>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Register;
