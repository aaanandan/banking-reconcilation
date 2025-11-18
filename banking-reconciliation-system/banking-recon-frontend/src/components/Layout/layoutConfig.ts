/**
 * Layout Configuration
 *
 * Configuration for layout components including menu items, themes, and settings
 */

import { MenuProps } from 'antd';

// ==================== TYPES ====================

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  requiresRole?: string[];
}

export interface MenuGroup {
  key: string;
  label: string;
  items: MenuItem[];
}

// ==================== MENU CONFIGURATION ====================

export const MENU_ITEMS: MenuGroup[] = [
  {
    key: 'main',
    label: 'Main',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'DashboardOutlined',
        path: '/dashboard',
      },
      {
        key: 'reconciliations',
        label: 'Reconciliations',
        icon: 'ReconciliationOutlined',
        path: '/reconciliations',
        children: [
          {
            key: 'new-reconciliation',
            label: 'New Reconciliation',
            icon: 'PlusOutlined',
            path: '/reconciliation/new',
          },
        ],
      },
    ],
  },
  {
    key: 'learning',
    label: 'Learning',
    items: [
      {
        key: 'questions',
        label: 'Learning Questions',
        icon: 'QuestionCircleOutlined',
        path: '/questions',
      },
      {
        key: 'profiles',
        label: 'Entity Profiles',
        icon: 'TeamOutlined',
        path: '/profiles',
      },
    ],
  },
  {
    key: 'management',
    label: 'Management',
    items: [
      {
        key: 'reports',
        label: 'Reports & Analytics',
        icon: 'BarChartOutlined',
        path: '/reports',
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'SettingOutlined',
        path: '/settings',
        requiresRole: ['admin', 'manager'],
      },
      {
        key: 'users',
        label: 'User Management',
        icon: 'UserOutlined',
        path: '/users',
        requiresRole: ['admin'],
      },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    items: [
      {
        key: 'help',
        label: 'Help & Documentation',
        icon: 'BookOutlined',
        path: '/help',
      },
    ],
  },
];

// ==================== LAYOUT SETTINGS ====================

export const LAYOUT_CONFIG = {
  // Sidebar
  sidebarWidth: 256,
  sidebarCollapsedWidth: 80,
  sidebarBreakpoint: 'lg' as const,

  // Header
  headerHeight: 64,

  // Content
  contentPadding: 24,

  // Theme
  defaultTheme: 'light' as 'light' | 'dark',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Filter menu items by user role
 */
export const filterMenuByRole = (items: MenuGroup[], userRole?: string): MenuGroup[] => {
  if (!userRole) return items;

  return items
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // If no role requirement, allow all
        if (!item.requiresRole || item.requiresRole.length === 0) {
          return true;
        }

        // Check if user role is in required roles
        return item.requiresRole.includes(userRole);
      }),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups
};

/**
 * Convert menu items to Ant Design Menu format
 */
export const convertToAntdMenuItems = (groups: MenuGroup[]): MenuProps['items'] => {
  const menuItems: MenuProps['items'] = [];

  groups.forEach((group) => {
    // Add group divider
    if (menuItems.length > 0) {
      menuItems.push({
        type: 'divider',
      });
    }

    // Add group items
    group.items.forEach((item) => {
      menuItems.push({
        key: item.key,
        label: item.label,
        // Note: Icon will be handled separately due to dynamic import
        children: item.children?.map((child) => ({
          key: child.key,
          label: child.label,
        })),
      });
    });
  });

  return menuItems;
};

/**
 * Get selected menu key from pathname
 */
export const getSelectedKeyFromPath = (pathname: string): string => {
  // Remove leading slash and split
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return 'dashboard';

  // Handle specific routes
  if (parts[0] === 'dashboard') return 'dashboard';
  if (parts[0] === 'reconciliation' || parts[0] === 'reconciliations') {
    if (parts[1] === 'new') return 'new-reconciliation';
    return 'reconciliations';
  }
  if (parts[0] === 'questions') return 'questions';
  if (parts[0] === 'profiles') return 'profiles';
  if (parts[0] === 'reports') return 'reports';
  if (parts[0] === 'settings') return 'settings';
  if (parts[0] === 'users') return 'users';
  if (parts[0] === 'help') return 'help';

  return parts[0];
};

/**
 * Get menu item by key
 */
export const getMenuItemByKey = (key: string): MenuItem | undefined => {
  for (const group of MENU_ITEMS) {
    for (const item of group.items) {
      if (item.key === key) return item;

      if (item.children) {
        const child = item.children.find((c) => c.key === key);
        if (child) return child;
      }
    }
  }
  return undefined;
};
