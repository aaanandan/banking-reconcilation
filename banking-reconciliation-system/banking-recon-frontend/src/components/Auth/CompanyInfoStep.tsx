/**
 * Company Info Step Component
 *
 * First step of registration: Collect company information
 */

import React from 'react';
import { Form, Input, Select, Button, Space, Typography } from 'antd';
import {
  ShopOutlined,
  TeamOutlined,
  GlobalOutlined,
  BankOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import {
  CompanyInfo,
  CompanySize,
  COMPANY_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
  validateCompanyName,
} from '../../utils/authUtils';

const { Title, Text } = Typography;
const { Option } = Select;

// Country list (common countries, can be expanded)
const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Singapore',
  'Ireland',
  'Netherlands',
  'Other',
];

export interface CompanyInfoStepProps {
  initialValues?: Partial<CompanyInfo>;
  onNext: (data: CompanyInfo) => void;
  loading?: boolean;
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
  initialValues,
  onNext,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const companyInfo: CompanyInfo = {
      companyName: values.companyName,
      companySize: values.companySize,
      industry: values.industry,
      country: values.country,
    };

    onNext(companyInfo);
  };

  return (
    <div className="company-info-step">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>Tell us about your company</Title>
          <Text type="secondary">
            This helps us customize your experience and set up your account.
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          name="company-info"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          initialValues={initialValues}
          autoComplete="off"
        >
          {/* Company Name */}
          <Form.Item
            name="companyName"
            label="Company Name"
            rules={[
              { required: true, message: 'Please enter your company name' },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  const validation = validateCompanyName(value);
                  if (!validation.valid) {
                    throw new Error(validation.error);
                  }
                },
              },
            ]}
          >
            <Input
              prefix={<ShopOutlined />}
              placeholder="Acme Corporation"
              disabled={loading}
              maxLength={100}
            />
          </Form.Item>

          {/* Company Size */}
          <Form.Item
            name="companySize"
            label="Company Size"
            rules={[{ required: true, message: 'Please select your company size' }]}
          >
            <Select
              placeholder="Select company size"
              disabled={loading}
              suffixIcon={<TeamOutlined />}
            >
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{option.label}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{option.description}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Industry (Optional) */}
          <Form.Item name="industry" label="Industry (Optional)">
            <Select
              placeholder="Select your industry"
              disabled={loading}
              suffixIcon={<BankOutlined />}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {INDUSTRY_OPTIONS.map((industry) => (
                <Option key={industry} value={industry}>
                  {industry}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Country */}
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please select your country' }]}
          >
            <Select
              placeholder="Select your country"
              disabled={loading}
              suffixIcon={<GlobalOutlined />}
              showSearch
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {COUNTRIES.map((country) => (
                <Option key={country} value={country}>
                  {country}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              icon={<ArrowRightOutlined />}
              loading={loading}
              style={{ height: 48, fontSize: 16, fontWeight: 500 }}
              iconPosition="end"
            >
              Continue to User Details
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </div>
  );
};
