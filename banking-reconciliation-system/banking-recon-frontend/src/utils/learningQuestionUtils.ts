/**
 * Learning Question Types and Utilities
 * Helper functions for managing learning questions and user feedback
 */

// ============================================================================
// TYPES
// ============================================================================

export enum QuestionType {
  ENTITY_IDENTITY = 'entity_identity',
  ENTITY_RELATIONSHIP = 'entity_relationship',
  BUSINESS_PATTERN = 'business_pattern',
  VALUE_PATTERN = 'value_pattern',
  TIMING_PATTERN = 'timing_pattern',
  FIELD_PREFERENCE = 'field_preference',
  EXCEPTION_REASON = 'exception_reason',
  GENERAL_CONTEXT = 'general_context',
}

export enum QuestionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum QuestionTiming {
  IMMEDIATE = 'immediate',
  STEP_END = 'step_end',
  SESSION_END = 'session_end',
  DEFERRED = 'deferred',
}

export enum AnswerType {
  TEXT = 'text',
  CHOICE = 'choice',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
}

export interface LearningQuestion {
  id: string;
  tenantId: string;
  questionId: string;
  type: QuestionType;
  priority: QuestionPriority;
  timing: QuestionTiming;
  question: string;
  context: string;
  suggestedAnswers: string[] | null;
  answerType: AnswerType;
  relatedEntityId: string | null;
  relatedTransactionIds: number[];
  relatedReconciliationId: string | null;
  triggeredBy: string;
  answer: any;
  answeredAt: Date | null;
  expiresAt: Date | null;
  helpText: string | null;
  exampleAnswer: string | null;
  createdAt: Date;
}

export interface QuestionFilter {
  search?: string;
  type?: QuestionType[];
  priority?: QuestionPriority[];
  timing?: QuestionTiming[];
  answered?: boolean;
  expired?: boolean;
}

export interface QuestionStats {
  total: number;
  answered: number;
  unanswered: number;
  expired: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<QuestionType, number>;
  byTiming: Record<QuestionTiming, number>;
}

export interface QuestionQueue {
  immediate: LearningQuestion[];
  stepEnd: LearningQuestion[];
  sessionEnd: LearningQuestion[];
  deferred: LearningQuestion[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get question type label
 */
export const getQuestionTypeLabel = (type: QuestionType): string => {
  switch (type) {
    case QuestionType.ENTITY_IDENTITY:
      return 'Entity Identity';
    case QuestionType.ENTITY_RELATIONSHIP:
      return 'Entity Relationship';
    case QuestionType.BUSINESS_PATTERN:
      return 'Business Pattern';
    case QuestionType.VALUE_PATTERN:
      return 'Value Pattern';
    case QuestionType.TIMING_PATTERN:
      return 'Timing Pattern';
    case QuestionType.FIELD_PREFERENCE:
      return 'Field Preference';
    case QuestionType.EXCEPTION_REASON:
      return 'Exception Reason';
    case QuestionType.GENERAL_CONTEXT:
      return 'General Context';
    default:
      return type;
  }
};

/**
 * Get question type color
 */
export const getQuestionTypeColor = (type: QuestionType): string => {
  switch (type) {
    case QuestionType.ENTITY_IDENTITY:
      return 'purple';
    case QuestionType.ENTITY_RELATIONSHIP:
      return 'cyan';
    case QuestionType.BUSINESS_PATTERN:
      return 'blue';
    case QuestionType.VALUE_PATTERN:
      return 'green';
    case QuestionType.TIMING_PATTERN:
      return 'orange';
    case QuestionType.FIELD_PREFERENCE:
      return 'geekblue';
    case QuestionType.EXCEPTION_REASON:
      return 'red';
    case QuestionType.GENERAL_CONTEXT:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get priority label
 */
export const getPriorityLabel = (priority: QuestionPriority): string => {
  switch (priority) {
    case QuestionPriority.CRITICAL:
      return 'Critical';
    case QuestionPriority.HIGH:
      return 'High';
    case QuestionPriority.MEDIUM:
      return 'Medium';
    case QuestionPriority.LOW:
      return 'Low';
    default:
      return priority;
  }
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: QuestionPriority): string => {
  switch (priority) {
    case QuestionPriority.CRITICAL:
      return '#cf1322';  // Dark red
    case QuestionPriority.HIGH:
      return '#ff4d4f';  // Red
    case QuestionPriority.MEDIUM:
      return '#faad14';  // Orange
    case QuestionPriority.LOW:
      return '#52c41a';  // Green
    default:
      return '#d9d9d9';  // Gray
  }
};

/**
 * Get timing label
 */
export const getTimingLabel = (timing: QuestionTiming): string => {
  switch (timing) {
    case QuestionTiming.IMMEDIATE:
      return 'Immediate';
    case QuestionTiming.STEP_END:
      return 'Step End';
    case QuestionTiming.SESSION_END:
      return 'Session End';
    case QuestionTiming.DEFERRED:
      return 'Deferred';
    default:
      return timing;
  }
};

/**
 * Get timing color
 */
export const getTimingColor = (timing: QuestionTiming): string => {
  switch (timing) {
    case QuestionTiming.IMMEDIATE:
      return 'error';
    case QuestionTiming.STEP_END:
      return 'warning';
    case QuestionTiming.SESSION_END:
      return 'processing';
    case QuestionTiming.DEFERRED:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Check if question is expired
 */
export const isQuestionExpired = (question: LearningQuestion): boolean => {
  if (!question.expiresAt) return false;
  return new Date(question.expiresAt) < new Date();
};

/**
 * Check if question is answered
 */
export const isQuestionAnswered = (question: LearningQuestion): boolean => {
  return question.answer !== null && question.answeredAt !== null;
};

/**
 * Get days until expiration
 */
export const getDaysUntilExpiration = (question: LearningQuestion): number | null => {
  if (!question.expiresAt) return null;
  const now = new Date();
  const expires = new Date(question.expiresAt);
  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate question statistics
 */
export const calculateQuestionStats = (questions: LearningQuestion[]): QuestionStats => {
  const total = questions.length;
  const answered = questions.filter((q) => isQuestionAnswered(q)).length;
  const unanswered = total - answered;
  const expired = questions.filter((q) => isQuestionExpired(q)).length;

  const critical = questions.filter((q) => q.priority === QuestionPriority.CRITICAL).length;
  const high = questions.filter((q) => q.priority === QuestionPriority.HIGH).length;
  const medium = questions.filter((q) => q.priority === QuestionPriority.MEDIUM).length;
  const low = questions.filter((q) => q.priority === QuestionPriority.LOW).length;

  const byType: Record<QuestionType, number> = {
    [QuestionType.ENTITY_IDENTITY]: 0,
    [QuestionType.ENTITY_RELATIONSHIP]: 0,
    [QuestionType.BUSINESS_PATTERN]: 0,
    [QuestionType.VALUE_PATTERN]: 0,
    [QuestionType.TIMING_PATTERN]: 0,
    [QuestionType.FIELD_PREFERENCE]: 0,
    [QuestionType.EXCEPTION_REASON]: 0,
    [QuestionType.GENERAL_CONTEXT]: 0,
  };

  const byTiming: Record<QuestionTiming, number> = {
    [QuestionTiming.IMMEDIATE]: 0,
    [QuestionTiming.STEP_END]: 0,
    [QuestionTiming.SESSION_END]: 0,
    [QuestionTiming.DEFERRED]: 0,
  };

  questions.forEach((q) => {
    byType[q.type] = (byType[q.type] || 0) + 1;
    byTiming[q.timing] = (byTiming[q.timing] || 0) + 1;
  });

  return {
    total,
    answered,
    unanswered,
    expired,
    critical,
    high,
    medium,
    low,
    byType,
    byTiming,
  };
};

/**
 * Filter questions
 */
export const filterQuestions = (
  questions: LearningQuestion[],
  filter: QuestionFilter
): LearningQuestion[] => {
  let result = [...questions];

  // Search
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(
      (q) =>
        q.question.toLowerCase().includes(searchLower) ||
        q.context.toLowerCase().includes(searchLower) ||
        q.triggeredBy.toLowerCase().includes(searchLower)
    );
  }

  // Type
  if (filter.type && filter.type.length > 0) {
    result = result.filter((q) => filter.type!.includes(q.type));
  }

  // Priority
  if (filter.priority && filter.priority.length > 0) {
    result = result.filter((q) => filter.priority!.includes(q.priority));
  }

  // Timing
  if (filter.timing && filter.timing.length > 0) {
    result = result.filter((q) => filter.timing!.includes(q.timing));
  }

  // Answered
  if (filter.answered !== undefined) {
    result = result.filter((q) => isQuestionAnswered(q) === filter.answered);
  }

  // Expired
  if (filter.expired !== undefined) {
    result = result.filter((q) => isQuestionExpired(q) === filter.expired);
  }

  return result;
};

/**
 * Sort questions by priority
 */
export const sortByPriority = (questions: LearningQuestion[]): LearningQuestion[] => {
  const priorityOrder = {
    [QuestionPriority.CRITICAL]: 0,
    [QuestionPriority.HIGH]: 1,
    [QuestionPriority.MEDIUM]: 2,
    [QuestionPriority.LOW]: 3,
  };

  return [...questions].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * Group questions into queue by timing
 */
export const groupIntoQueue = (questions: LearningQuestion[]): QuestionQueue => {
  const unanswered = questions.filter((q) => !isQuestionAnswered(q) && !isQuestionExpired(q));

  return {
    immediate: sortByPriority(unanswered.filter((q) => q.timing === QuestionTiming.IMMEDIATE)),
    stepEnd: sortByPriority(unanswered.filter((q) => q.timing === QuestionTiming.STEP_END)),
    sessionEnd: sortByPriority(unanswered.filter((q) => q.timing === QuestionTiming.SESSION_END)),
    deferred: sortByPriority(unanswered.filter((q) => q.timing === QuestionTiming.DEFERRED)),
  };
};

/**
 * Validate answer based on type
 */
export const validateAnswer = (
  answer: any,
  answerType: AnswerType,
  suggestedAnswers?: string[] | null
): { valid: boolean; error?: string } => {
  if (answer === null || answer === undefined || answer === '') {
    return { valid: false, error: 'Answer is required' };
  }

  switch (answerType) {
    case AnswerType.TEXT:
      if (typeof answer !== 'string') {
        return { valid: false, error: 'Answer must be text' };
      }
      if (answer.trim().length === 0) {
        return { valid: false, error: 'Answer cannot be empty' };
      }
      return { valid: true };

    case AnswerType.CHOICE:
      if (!suggestedAnswers || suggestedAnswers.length === 0) {
        return { valid: false, error: 'No choices available' };
      }
      if (!suggestedAnswers.includes(answer)) {
        return { valid: false, error: 'Answer must be one of the suggested options' };
      }
      return { valid: true };

    case AnswerType.BOOLEAN:
      if (typeof answer !== 'boolean') {
        return { valid: false, error: 'Answer must be true or false' };
      }
      return { valid: true };

    case AnswerType.NUMBER:
      const num = Number(answer);
      if (isNaN(num)) {
        return { valid: false, error: 'Answer must be a valid number' };
      }
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown answer type' };
  }
};

/**
 * Format answer for display
 */
export const formatAnswerForDisplay = (answer: any, answerType: AnswerType): string => {
  if (answer === null || answer === undefined) {
    return 'No answer provided';
  }

  switch (answerType) {
    case AnswerType.TEXT:
      return String(answer);
    case AnswerType.CHOICE:
      return String(answer);
    case AnswerType.BOOLEAN:
      return answer ? 'Yes' : 'No';
    case AnswerType.NUMBER:
      return String(answer);
    default:
      return String(answer);
  }
};

/**
 * Get question urgency badge text
 */
export const getUrgencyBadgeText = (question: LearningQuestion): string | null => {
  if (question.timing === QuestionTiming.IMMEDIATE) {
    return 'Answer Now';
  }

  const daysUntilExpiration = getDaysUntilExpiration(question);
  if (daysUntilExpiration !== null) {
    if (daysUntilExpiration <= 0) {
      return 'Expired';
    } else if (daysUntilExpiration === 1) {
      return 'Expires Today';
    } else if (daysUntilExpiration <= 3) {
      return `${daysUntilExpiration} days left`;
    }
  }

  return null;
};
