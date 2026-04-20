/**
 * Layout Components
 *
 * Exports all layout-related components
 */

export { MainLayout } from './MainLayout';
export { Header } from './Header';
export { Sidebar } from './Sidebar';

export type { MainLayoutProps } from './MainLayout';
export type { HeaderProps } from './Header';
export type { SidebarProps } from './Sidebar';

// Re-export layout configuration
export {
  MENU_ITEMS,
  LAYOUT_CONFIG,
  filterMenuByRole,
  convertToAntdMenuItems,
  getSelectedKeyFromPath,
  getMenuItemByKey,
} from './layoutConfig';

export type { MenuItem, MenuGroup } from './layoutConfig';
