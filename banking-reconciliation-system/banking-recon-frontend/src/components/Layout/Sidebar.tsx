/**
 * Sidebar Component
 *
 * Navigation sidebar with menu items
 */

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ReconciliationOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../../utils/authUtils';
import { MENU_ITEMS, filterMenuByRole, getSelectedKeyFromPath, LAYOUT_CONFIG } from './layoutConfig';

const { Sider } = Layout;

// Icon mapping
const IconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  ReconciliationOutlined: <ReconciliationOutlined />,
  PlusOutlined: <PlusOutlined />,
  QuestionCircleOutlined: <QuestionCircleOutlined />,
  TeamOutlined: <TeamOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  BookOutlined: <BookOutlined />,
};

export interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  // Filter menu items by user role
  const filteredMenuGroups = useMemo(() => {
    return filterMenuByRole(MENU_ITEMS, user?.role);
  }, [user?.role]);

  // Get selected menu key from current path
  const selectedKey = useMemo(() => {
    return getSelectedKeyFromPath(location.pathname);
  }, [location.pathname]);

  // Convert menu groups to Ant Design Menu format
  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [];

    filteredMenuGroups.forEach((group, groupIndex) => {
      // Add divider between groups (except before first group)
      if (groupIndex > 0) {
        items.push({
          type: 'divider',
        });
      }

      // Add group label (only when not collapsed)
      if (!collapsed) {
        items.push({
          type: 'group',
          label: group.label,
        });
      }

      // Add group items
      group.items.forEach((item) => {
        const menuItem: any = {
          key: item.key,
          label: item.label,
          icon: item.icon ? IconMap[item.icon] : undefined,
        };

        // Add children if any
        if (item.children && item.children.length > 0) {
          menuItem.children = item.children.map((child) => ({
            key: child.key,
            label: child.label,
            icon: child.icon ? IconMap[child.icon] : undefined,
          }));
        }

        items.push(menuItem);
      });
    });

    return items;
  }, [filteredMenuGroups, collapsed]);

  // Handle menu item click
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    // Find the menu item
    for (const group of filteredMenuGroups) {
      for (const item of group.items) {
        if (item.key === key && item.path) {
          navigate(item.path);
          return;
        }

        // Check children
        if (item.children) {
          const child = item.children.find((c) => c.key === key);
          if (child && child.path) {
            navigate(child.path);
            return;
          }
        }
      }
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={LAYOUT_CONFIG.sidebarWidth}
      collapsedWidth={LAYOUT_CONFIG.sidebarCollapsedWidth}
      breakpoint={LAYOUT_CONFIG.sidebarBreakpoint}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: LAYOUT_CONFIG.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Logo placeholder - could be replaced with actual logo */}
      </div>

      {/* Navigation Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};
