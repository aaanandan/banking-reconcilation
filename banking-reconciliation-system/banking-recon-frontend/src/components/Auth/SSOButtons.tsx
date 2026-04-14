/**
 * SSO Buttons Component
 *
 * Social sign-on buttons for Google and Microsoft authentication
 */

import React from 'react';
import { Button, Space, Divider, Typography } from 'antd';
import { GoogleOutlined, WindowsOutlined } from '@ant-design/icons';
import { SSOProvider, SSO_CONFIGS, getSSOAuthUrl } from '../../utils/authUtils';

const { Text } = Typography;

export interface SSOButtonsProps {
  onSSOClick?: (provider: SSOProvider) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SSOButtons: React.FC<SSOButtonsProps> = ({
  onSSOClick,
  loading = false,
  disabled = false,
}) => {
  const handleSSOClick = (provider: SSOProvider) => {
    if (onSSOClick) {
      onSSOClick(provider);
    } else {
      // Default behavior: redirect to SSO auth URL
      const redirectUri = `${window.location.origin}/auth/callback`;
      const authUrl = getSSOAuthUrl(provider, redirectUri);
      window.location.href = authUrl;
    }
  };

  const googleConfig = SSO_CONFIGS[SSOProvider.GOOGLE];
  const microsoftConfig = SSO_CONFIGS[SSOProvider.MICROSOFT];

  return (
    <div className="sso-buttons">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Google SSO Button */}
        <Button
          size="large"
          block
          icon={<GoogleOutlined />}
          onClick={() => handleSSOClick(SSOProvider.GOOGLE)}
          loading={loading}
          disabled={disabled}
          style={{
            borderColor: '#e0e0e0',
            color: googleConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {googleConfig.label}
        </Button>

        {/* Microsoft SSO Button */}
        <Button
          size="large"
          block
          icon={<WindowsOutlined />}
          onClick={() => handleSSOClick(SSOProvider.MICROSOFT)}
          loading={loading}
          disabled={disabled}
          style={{
            borderColor: '#e0e0e0',
            color: microsoftConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {microsoftConfig.label}
        </Button>

        {/* Divider */}
        <Divider style={{ margin: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            or continue with email
          </Text>
        </Divider>
      </Space>
    </div>
  );
};
