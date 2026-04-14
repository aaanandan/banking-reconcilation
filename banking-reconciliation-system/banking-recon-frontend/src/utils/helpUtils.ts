/**
 * Help and Documentation Types and Utilities
 * Help articles, FAQs, tutorials, and support
 */

// ============================================================================
// TYPES
// ============================================================================

export enum HelpCategory {
  GETTING_STARTED = 'getting_started',
  RECONCILIATION = 'reconciliation',
  MATCHING = 'matching',
  LEARNING = 'learning',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  USER_MANAGEMENT = 'user_management',
  TROUBLESHOOTING = 'troubleshooting',
  API = 'api',
}

export enum ArticleDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum VideoLength {
  SHORT = 'short', // < 3 min
  MEDIUM = 'medium', // 3-10 min
  LONG = 'long', // > 10 min
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  difficulty: ArticleDifficulty;
  summary: string;
  content: string; // Markdown content
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  lastUpdated: Date;
  estimatedReadTime: number; // minutes
}

export interface FAQ {
  id: string;
  question: string;
  answer: string; // Markdown content
  category: HelpCategory;
  tags: string[];
  helpful: number;
  notHelpful: number;
  order: number;
}

export interface VideoTutorial {
  id: string;
  title: string;
  category: HelpCategory;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // seconds
  length: VideoLength;
  views: number;
  lastUpdated: Date;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: HelpCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  attachments: string[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface GettingStartedGuide {
  id: string;
  title: string;
  description: string;
  steps: GettingStartedStep[];
  estimatedTime: number; // minutes
  difficulty: ArticleDifficulty;
}

export interface GettingStartedStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface HelpStats {
  totalArticles: number;
  totalFAQs: number;
  totalVideos: number;
  byCategory: Record<HelpCategory, number>;
  popularArticles: HelpArticle[];
  popularFAQs: FAQ[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const HELP_CATEGORIES = [
  {
    category: HelpCategory.GETTING_STARTED,
    label: 'Getting Started',
    icon: 'RocketOutlined',
    description: 'New to the system? Start here for basics and onboarding',
  },
  {
    category: HelpCategory.RECONCILIATION,
    label: 'Reconciliation',
    icon: 'ReconciliationOutlined',
    description: 'Learn how to perform bank reconciliations',
  },
  {
    category: HelpCategory.MATCHING,
    label: 'Matching',
    icon: 'LinkOutlined',
    description: 'Understanding transaction matching and approval',
  },
  {
    category: HelpCategory.LEARNING,
    label: 'Learning System',
    icon: 'BulbOutlined',
    description: 'How the system learns from your decisions',
  },
  {
    category: HelpCategory.REPORTS,
    label: 'Reports & Analytics',
    icon: 'BarChartOutlined',
    description: 'Generate and analyze reports',
  },
  {
    category: HelpCategory.SETTINGS,
    label: 'Settings',
    icon: 'SettingOutlined',
    description: 'Configure system settings and preferences',
  },
  {
    category: HelpCategory.USER_MANAGEMENT,
    label: 'User Management',
    icon: 'TeamOutlined',
    description: 'Manage users, roles, and permissions',
  },
  {
    category: HelpCategory.TROUBLESHOOTING,
    label: 'Troubleshooting',
    icon: 'ToolOutlined',
    description: 'Common issues and solutions',
  },
  {
    category: HelpCategory.API,
    label: 'API & Integrations',
    icon: 'ApiOutlined',
    description: 'API documentation and integration guides',
  },
];

export const SAMPLE_GETTING_STARTED_GUIDES: GettingStartedGuide[] = [
  {
    id: '1',
    title: 'Quick Start: Your First Reconciliation',
    description: 'Learn the basics by completing your first bank reconciliation',
    estimatedTime: 15,
    difficulty: ArticleDifficulty.BEGINNER,
    steps: [
      {
        id: '1',
        title: 'Upload Bank Statement',
        description: 'Navigate to Reconciliations and upload your bank statement file (CSV, Excel, or PDF)',
        completed: false,
        order: 1,
      },
      {
        id: '2',
        title: 'Map Columns',
        description: 'Map your file columns (Date, Description, Amount) to system fields',
        completed: false,
        order: 2,
      },
      {
        id: '3',
        title: 'Review Matches',
        description: 'Review automatically matched transactions',
        completed: false,
        order: 3,
      },
      {
        id: '4',
        title: 'Approve or Reject',
        description: 'Approve good matches, reject incorrect ones',
        completed: false,
        order: 4,
      },
      {
        id: '5',
        title: 'Generate Report',
        description: 'Generate a reconciliation summary report',
        completed: false,
        order: 5,
      },
    ],
  },
  {
    id: '2',
    title: 'Understanding the Learning System',
    description: 'Learn how the system improves over time based on your decisions',
    estimatedTime: 10,
    difficulty: ArticleDifficulty.INTERMEDIATE,
    steps: [
      {
        id: '1',
        title: 'What is the Learning System?',
        description: 'Understand how the system learns entity patterns and matching rules',
        completed: false,
        order: 1,
      },
      {
        id: '2',
        title: 'Answer Learning Questions',
        description: 'Respond to questions about entities and patterns',
        completed: false,
        order: 2,
      },
      {
        id: '3',
        title: 'View Entity Profiles',
        description: 'See what the system has learned about each entity',
        completed: false,
        order: 3,
      },
      {
        id: '4',
        title: 'Configure Learning Settings',
        description: 'Adjust learning aggressiveness and question timing',
        completed: false,
        order: 4,
      },
    ],
  },
  {
    id: '3',
    title: 'Setting Up Your Team',
    description: 'Invite users and configure roles and permissions',
    estimatedTime: 20,
    difficulty: ArticleDifficulty.INTERMEDIATE,
    steps: [
      {
        id: '1',
        title: 'Understand User Roles',
        description: 'Learn about Admin, Manager, User, and Viewer roles',
        completed: false,
        order: 1,
      },
      {
        id: '2',
        title: 'Invite Team Members',
        description: 'Send email invitations to your team',
        completed: false,
        order: 2,
      },
      {
        id: '3',
        title: 'Assign Roles',
        description: 'Assign appropriate roles based on responsibilities',
        completed: false,
        order: 3,
      },
      {
        id: '4',
        title: 'Configure Permissions',
        description: 'Review and adjust permissions for each role',
        completed: false,
        order: 4,
      },
    ],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get category label
 */
export const getCategoryLabel = (category: HelpCategory): string => {
  const cat = HELP_CATEGORIES.find((c) => c.category === category);
  return cat?.label || category;
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: HelpCategory): string => {
  const cat = HELP_CATEGORIES.find((c) => c.category === category);
  return cat?.icon || 'QuestionCircleOutlined';
};

/**
 * Get category description
 */
export const getCategoryDescription = (category: HelpCategory): string => {
  const cat = HELP_CATEGORIES.find((c) => c.category === category);
  return cat?.description || '';
};

/**
 * Get difficulty label
 */
export const getDifficultyLabel = (difficulty: ArticleDifficulty): string => {
  switch (difficulty) {
    case ArticleDifficulty.BEGINNER:
      return 'Beginner';
    case ArticleDifficulty.INTERMEDIATE:
      return 'Intermediate';
    case ArticleDifficulty.ADVANCED:
      return 'Advanced';
    default:
      return difficulty;
  }
};

/**
 * Get difficulty color
 */
export const getDifficultyColor = (difficulty: ArticleDifficulty): string => {
  switch (difficulty) {
    case ArticleDifficulty.BEGINNER:
      return 'success';
    case ArticleDifficulty.INTERMEDIATE:
      return 'warning';
    case ArticleDifficulty.ADVANCED:
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get video length label
 */
export const getVideoLengthLabel = (length: VideoLength): string => {
  switch (length) {
    case VideoLength.SHORT:
      return '< 3 min';
    case VideoLength.MEDIUM:
      return '3-10 min';
    case VideoLength.LONG:
      return '> 10 min';
    default:
      return length;
  }
};

/**
 * Format duration (seconds to mm:ss)
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate video length from duration
 */
export const getVideoLength = (duration: number): VideoLength => {
  if (duration < 180) return VideoLength.SHORT;
  if (duration < 600) return VideoLength.MEDIUM;
  return VideoLength.LONG;
};

/**
 * Calculate helpfulness score
 */
export const calculateHelpfulnessScore = (helpful: number, notHelpful: number): number => {
  const total = helpful + notHelpful;
  if (total === 0) return 0;
  return Math.round((helpful / total) * 100);
};

/**
 * Search help articles
 */
export const searchArticles = (articles: HelpArticle[], query: string): HelpArticle[] => {
  if (!query || query.trim().length === 0) return articles;

  const queryLower = query.toLowerCase();
  return articles.filter(
    (article) =>
      article.title.toLowerCase().includes(queryLower) ||
      article.summary.toLowerCase().includes(queryLower) ||
      article.content.toLowerCase().includes(queryLower) ||
      article.tags.some((tag) => tag.toLowerCase().includes(queryLower))
  );
};

/**
 * Search FAQs
 */
export const searchFAQs = (faqs: FAQ[], query: string): FAQ[] => {
  if (!query || query.trim().length === 0) return faqs;

  const queryLower = query.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(queryLower) ||
      faq.answer.toLowerCase().includes(queryLower) ||
      faq.tags.some((tag) => tag.toLowerCase().includes(queryLower))
  );
};

/**
 * Filter articles by category
 */
export const filterArticlesByCategory = (
  articles: HelpArticle[],
  category: HelpCategory | null
): HelpArticle[] => {
  if (!category) return articles;
  return articles.filter((article) => article.category === category);
};

/**
 * Filter articles by difficulty
 */
export const filterArticlesByDifficulty = (
  articles: HelpArticle[],
  difficulty: ArticleDifficulty | null
): HelpArticle[] => {
  if (!difficulty) return articles;
  return articles.filter((article) => article.difficulty === difficulty);
};

/**
 * Sort articles
 */
export const sortArticles = (
  articles: HelpArticle[],
  field: 'title' | 'views' | 'helpful' | 'lastUpdated',
  order: 'asc' | 'desc'
): HelpArticle[] => {
  const sorted = [...articles];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'helpful':
        aValue = calculateHelpfulnessScore(a.helpful, a.notHelpful);
        bValue = calculateHelpfulnessScore(b.helpful, b.notHelpful);
        break;
      case 'lastUpdated':
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Get popular articles
 */
export const getPopularArticles = (articles: HelpArticle[], limit: number = 5): HelpArticle[] => {
  return sortArticles(articles, 'views', 'desc').slice(0, limit);
};

/**
 * Get popular FAQs
 */
export const getPopularFAQs = (faqs: FAQ[], limit: number = 5): FAQ[] => {
  return [...faqs]
    .sort((a, b) => {
      const aScore = calculateHelpfulnessScore(a.helpful, a.notHelpful);
      const bScore = calculateHelpfulnessScore(b.helpful, b.notHelpful);
      return bScore - aScore;
    })
    .slice(0, limit);
};

/**
 * Calculate help stats
 */
export const calculateHelpStats = (
  articles: HelpArticle[],
  faqs: FAQ[],
  videos: VideoTutorial[]
): HelpStats => {
  const byCategory: Record<HelpCategory, number> = {
    [HelpCategory.GETTING_STARTED]: 0,
    [HelpCategory.RECONCILIATION]: 0,
    [HelpCategory.MATCHING]: 0,
    [HelpCategory.LEARNING]: 0,
    [HelpCategory.REPORTS]: 0,
    [HelpCategory.SETTINGS]: 0,
    [HelpCategory.USER_MANAGEMENT]: 0,
    [HelpCategory.TROUBLESHOOTING]: 0,
    [HelpCategory.API]: 0,
  };

  articles.forEach((article) => {
    byCategory[article.category]++;
  });

  faqs.forEach((faq) => {
    byCategory[faq.category]++;
  });

  videos.forEach((video) => {
    byCategory[video.category]++;
  });

  return {
    totalArticles: articles.length,
    totalFAQs: faqs.length,
    totalVideos: videos.length,
    byCategory,
    popularArticles: getPopularArticles(articles, 5),
    popularFAQs: getPopularFAQs(faqs, 5),
  };
};

/**
 * Get recommended articles for category
 */
export const getRecommendedArticles = (
  articles: HelpArticle[],
  category: HelpCategory,
  limit: number = 3
): HelpArticle[] => {
  const categoryArticles = filterArticlesByCategory(articles, category);
  return getPopularArticles(categoryArticles, limit);
};

/**
 * Get progress percentage for getting started guide
 */
export const getGuideProgress = (guide: GettingStartedGuide): number => {
  const completedSteps = guide.steps.filter((step) => step.completed).length;
  return Math.round((completedSteps / guide.steps.length) * 100);
};
