/**
 * Main Layout Component
 *
 * Main application layout with sidebar, header, and content area
 */

import React, { useState } from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LAYOUT_CONFIG } from './layoutConfig';

const { Content } = Layout;

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main Content Area */}
      <Layout
        style={{
          marginLeft: collapsed ? LAYOUT_CONFIG.sidebarCollapsedWidth : LAYOUT_CONFIG.sidebarWidth,
          transition: 'margin-left 0.2s',
        }}
      >
        {/* Header */}
        <Header collapsed={collapsed} onToggle={handleToggle} />

        {/* Content */}
        <Content
          style={{
            padding: LAYOUT_CONFIG.contentPadding,
            minHeight: `calc(100vh - ${LAYOUT_CONFIG.headerHeight}px)`,
            background: '#f0f2f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
