/**
 * Header Component
 *
 * Top navigation bar with logo, breadcrumbs, notifications, and user menu
 */

import React from 'react';
import { Layout, Space, Dropdown, Avatar, Badge, Button, Breadcrumb, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  BankOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, getUserDisplayName, getUserInitials, clearAuthData } from '../../utils/authUtils';
import { generateBreadcrumbs, ROUTES } from '../../routes/routes';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  // Generate breadcrumbs from current path
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Handle logout
  const handleLogout = () => {
    clearAuthData();
    navigate(ROUTES.LOGIN);
  };

  // User menu items
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => {
        // Navigate to profile page
        console.log('Navigate to profile');
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        navigate(ROUTES.SETTINGS);
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  // Notifications menu items (placeholder)
  const notificationsMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div style={{ width: 300 }}>
          <Text strong>New reconciliation complete</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Reconciliation #123 has been processed successfully
          </Text>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div style={{ width: 300 }}>
          <Text strong>Learning question pending</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            3 new learning questions require your attention
          </Text>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'view-all',
      label: (
        <Text type="link" style={{ textAlign: 'center', display: 'block' }}>
          View all notifications
        </Text>
      ),
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Toggle + Logo + Breadcrumbs */}
      <Space size="large">
        {/* Sidebar Toggle */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ fontSize: 18 }}
        />

        {/* Logo (hidden on mobile when sidebar is visible) */}
        <Space
          size="small"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          <BankOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>
            Banking Reconciliation
          </Text>
        </Space>

        {/* Breadcrumbs (hidden on mobile) */}
        <Breadcrumb
          style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}
          items={breadcrumbs.map((crumb) => ({
            title: crumb.path ? (
              <a onClick={() => crumb.path && navigate(crumb.path)}>{crumb.title}</a>
            ) : (
              crumb.title
            ),
          }))}
        />
      </Space>

      {/* Right: Notifications + User Menu */}
      <Space size="middle">
        {/* Notifications */}
        <Dropdown menu={{ items: notificationsMenuItems }} trigger={['click']} placement="bottomRight">
          <Badge count={2} size="small">
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
          </Badge>
        </Dropdown>

        {/* User Menu */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="default" style={{ backgroundColor: '#1890ff' }}>
              {user ? getUserInitials(user) : <UserOutlined />}
            </Avatar>
            <div style={{ lineHeight: 1.2 }}>
              <Text strong style={{ fontSize: 14 }}>
                {user ? getUserDisplayName(user) : 'User'}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user?.role || 'User'}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};
