/**
 * Dashboard Types and Utilities
 * Dashboard metrics, statistics, and activity tracking
 */

// ============================================================================
// TYPES
// ============================================================================

export enum ActivityType {
  RECONCILIATION_STARTED = 'reconciliation_started',
  RECONCILIATION_COMPLETED = 'reconciliation_completed',
  MATCH_APPROVED = 'match_approved',
  MATCH_REJECTED = 'match_rejected',
  QUESTION_ANSWERED = 'question_answered',
  REPORT_GENERATED = 'report_generated',
  USER_INVITED = 'user_invited',
  SETTINGS_UPDATED = 'settings_updated',
}

export enum MetricTrend {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface DashboardMetrics {
  reconciliations: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    trend: MetricTrend;
    trendPercentage: number;
  };
  matches: {
    total: number;
    automated: number;
    manual: number;
    automationRate: number;
  };
  unmatched: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  entities: {
    total: number;
    learned: number;
    pendingQuestions: number;
  };
  users: {
    total: number;
    active: number;
    pending: number;
  };
}

export interface RecentReconciliation {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'review' | 'completed' | 'failed';
  progress: number;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  createdAt: Date;
  createdBy: string;
  completedAt: Date | null;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  permission?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-reconciliation',
    title: 'New Reconciliation',
    description: 'Start a new bank reconciliation',
    icon: 'PlusCircleOutlined',
    color: '#1890ff',
    route: '/reconciliation/new',
  },
  {
    id: 'view-unmatched',
    title: 'Unmatched Pool',
    description: 'Review unmatched transactions',
    icon: 'ExclamationCircleOutlined',
    color: '#faad14',
    route: '/unmatched',
  },
  {
    id: 'answer-questions',
    title: 'Learning Questions',
    description: 'Answer pending questions',
    icon: 'BulbOutlined',
    color: '#722ed1',
    route: '/questions',
  },
  {
    id: 'generate-report',
    title: 'Generate Report',
    description: 'Create analytics report',
    icon: 'FileTextOutlined',
    color: '#52c41a',
    route: '/reports',
  },
  {
    id: 'view-entities',
    title: 'Entity Profiles',
    description: 'Manage entity profiles',
    icon: 'IdcardOutlined',
    color: '#13c2c2',
    route: '/profiles',
  },
  {
    id: 'system-settings',
    title: 'Settings',
    description: 'Configure system settings',
    icon: 'SettingOutlined',
    color: '#8c8c8c',
    route: '/settings',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get activity type label
 */
export const getActivityTypeLabel = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.RECONCILIATION_STARTED:
      return 'Reconciliation Started';
    case ActivityType.RECONCILIATION_COMPLETED:
      return 'Reconciliation Completed';
    case ActivityType.MATCH_APPROVED:
      return 'Match Approved';
    case ActivityType.MATCH_REJECTED:
      return 'Match Rejected';
    case ActivityType.QUESTION_ANSWERED:
      return 'Question Answered';
    case ActivityType.REPORT_GENERATED:
      return 'Report Generated';
    case ActivityType.USER_INVITED:
      return 'User Invited';
    case ActivityType.SETTINGS_UPDATED:
      return 'Settings Updated';
    default:
      return type;
  }
};

/**
 * Get activity type icon
 */
export const getActivityTypeIcon = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.RECONCILIATION_STARTED:
      return 'PlayCircleOutlined';
    case ActivityType.RECONCILIATION_COMPLETED:
      return 'CheckCircleOutlined';
    case ActivityType.MATCH_APPROVED:
      return 'CheckOutlined';
    case ActivityType.MATCH_REJECTED:
      return 'CloseOutlined';
    case ActivityType.QUESTION_ANSWERED:
      return 'BulbOutlined';
    case ActivityType.REPORT_GENERATED:
      return 'FileTextOutlined';
    case ActivityType.USER_INVITED:
      return 'UserAddOutlined';
    case ActivityType.SETTINGS_UPDATED:
      return 'SettingOutlined';
    default:
      return 'InfoCircleOutlined';
  }
};

/**
 * Get activity type color
 */
export const getActivityTypeColor = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.RECONCILIATION_STARTED:
      return '#1890ff';
    case ActivityType.RECONCILIATION_COMPLETED:
      return '#52c41a';
    case ActivityType.MATCH_APPROVED:
      return '#52c41a';
    case ActivityType.MATCH_REJECTED:
      return '#ff4d4f';
    case ActivityType.QUESTION_ANSWERED:
      return '#722ed1';
    case ActivityType.REPORT_GENERATED:
      return '#13c2c2';
    case ActivityType.USER_INVITED:
      return '#faad14';
    case ActivityType.SETTINGS_UPDATED:
      return '#8c8c8c';
    default:
      return '#1890ff';
  }
};

/**
 * Get reconciliation status label
 */
export const getReconciliationStatusLabel = (
  status: 'pending' | 'processing' | 'review' | 'completed' | 'failed'
): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'review':
      return 'In Review';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
};

/**
 * Get reconciliation status color
 */
export const getReconciliationStatusColor = (
  status: 'pending' | 'processing' | 'review' | 'completed' | 'failed'
): string => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'processing':
      return 'processing';
    case 'review':
      return 'warning';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Calculate metric trend
 */
export const calculateTrend = (current: number, previous: number): {
  trend: MetricTrend;
  percentage: number;
} => {
  if (previous === 0) {
    return { trend: MetricTrend.STABLE, percentage: 0 };
  }

  const change = ((current - previous) / previous) * 100;
  const percentage = Math.abs(Math.round(change));

  if (change > 5) {
    return { trend: MetricTrend.UP, percentage };
  } else if (change < -5) {
    return { trend: MetricTrend.DOWN, percentage };
  } else {
    return { trend: MetricTrend.STABLE, percentage };
  }
};

/**
 * Get trend icon
 */
export const getTrendIcon = (trend: MetricTrend): string => {
  switch (trend) {
    case MetricTrend.UP:
      return 'ArrowUpOutlined';
    case MetricTrend.DOWN:
      return 'ArrowDownOutlined';
    case MetricTrend.STABLE:
      return 'MinusOutlined';
    default:
      return 'MinusOutlined';
  }
};

/**
 * Get trend color
 */
export const getTrendColor = (trend: MetricTrend, inverse: boolean = false): string => {
  if (trend === MetricTrend.STABLE) return '#8c8c8c';

  if (inverse) {
    // For metrics where down is good (e.g., unmatched count)
    return trend === MetricTrend.UP ? '#ff4d4f' : '#52c41a';
  } else {
    // For metrics where up is good (e.g., reconciliations count)
    return trend === MetricTrend.UP ? '#52c41a' : '#ff4d4f';
  }
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return new Date(date).toLocaleDateString();
};

/**
 * Calculate completion percentage
 */
export const calculateCompletionPercentage = (matched: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((matched / total) * 100);
};

/**
 * Sort activities by timestamp
 */
export const sortActivitiesByTime = (activities: ActivityItem[]): ActivityItem[] => {
  return [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Filter recent activities
 */
export const getRecentActivities = (activities: ActivityItem[], limit: number = 10): ActivityItem[] => {
  return sortActivitiesByTime(activities).slice(0, limit);
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = (notifications: Notification[]): number => {
  return notifications.filter((n) => !n.read).length;
};

/**
 * Group notifications by type
 */
export const groupNotificationsByType = (
  notifications: Notification[]
): Record<string, Notification[]> => {
  return notifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = [];
    }
    acc[notification.type].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);
};

/**
 * Calculate automation rate
 */
export const calculateAutomationRate = (automated: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((automated / total) * 100);
};

/**
 * Get urgency level for unmatched count
 */
export const getUnmatchedUrgencyLevel = (count: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (count === 0) return 'low';
  if (count < 10) return 'low';
  if (count < 50) return 'medium';
  if (count < 100) return 'high';
  return 'critical';
};

/**
 * Get urgency color
 */
export const getUrgencyColor = (urgency: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (urgency) {
    case 'low':
      return '#52c41a';
    case 'medium':
      return '#faad14';
    case 'high':
      return '#ff7a45';
    case 'critical':
      return '#ff4d4f';
    default:
      return '#8c8c8c';
  }
};
