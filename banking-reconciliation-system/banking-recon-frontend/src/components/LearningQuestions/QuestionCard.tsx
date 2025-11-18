import React from 'react';
import { Card, Tag, Space, Typography, Badge, Alert, Divider, Tooltip } from 'antd';
import {
  QuestionCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  LearningQuestion,
  getQuestionTypeLabel,
  getQuestionTypeColor,
  getPriorityLabel,
  getPriorityColor,
  getTimingLabel,
  getTimingColor,
  isQuestionExpired,
  isQuestionAnswered,
  getDaysUntilExpiration,
  getUrgencyBadgeText,
  formatAnswerForDisplay,
} from '../../utils/learningQuestionUtils';

const { Text, Title, Paragraph } = Typography;

interface QuestionCardProps {
  question: LearningQuestion;
  onAnswer?: (questionId: string) => void;
  showAnswer?: boolean;
  compact?: boolean;
}

/**
 * Card displaying a learning question with context
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  showAnswer = false,
  compact = false,
}) => {
  const expired = isQuestionExpired(question);
  const answered = isQuestionAnswered(question);
  const daysUntilExpiration = getDaysUntilExpiration(question);
  const urgencyText = getUrgencyBadgeText(question);

  const priorityColor = getPriorityColor(question.priority);

  return (
    <Card
      size="small"
      style={{
        border: `1px solid ${answered ? '#52c41a' : expired ? '#ff4d4f' : priorityColor}`,
        borderLeft: `4px solid ${answered ? '#52c41a' : expired ? '#ff4d4f' : priorityColor}`,
        backgroundColor: answered ? '#f6ffed' : expired ? '#fff2f0' : '#fff',
        marginBottom: compact ? 8 : 12,
        opacity: expired ? 0.7 : 1,
      }}
      bodyStyle={{ padding: compact ? 12 : 16 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="small" wrap>
              <Tag color={getQuestionTypeColor(question.type)}>
                {getQuestionTypeLabel(question.type)}
              </Tag>
              <Tag color={getTimingColor(question.timing)}>
                {getTimingLabel(question.timing)}
              </Tag>
              <Tooltip title={getPriorityLabel(question.priority)}>
                <Tag color={priorityColor} style={{ fontWeight: 'bold' }}>
                  {question.priority.toUpperCase()}
                </Tag>
              </Tooltip>
              {answered && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Answered
                </Tag>
              )}
              {expired && (
                <Tag color="error" icon={<WarningOutlined />}>
                  Expired
                </Tag>
              )}
            </Space>

            {urgencyText && !answered && !expired && (
              <Badge
                count={urgencyText}
                style={{
                  backgroundColor: question.timing === 'immediate' ? '#cf1322' : '#faad14',
                }}
              />
            )}
          </div>

          {/* Expiration info */}
          {!answered && daysUntilExpiration !== null && daysUntilExpiration > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <ClockCircleOutlined /> Expires in {daysUntilExpiration} day
                {daysUntilExpiration !== 1 ? 's' : ''}
              </Text>
            </div>
          )}
        </Space>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
          <QuestionCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {question.question}
        </Title>
      </div>

      {/* Context */}
      {!compact && question.context && (
        <div style={{ marginBottom: 12 }}>
          <Alert
            message="Context"
            description={<Paragraph style={{ margin: 0, fontSize: 13 }}>{question.context}</Paragraph>}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ fontSize: 12 }}
          />
        </div>
      )}

      {/* Help Text */}
      {!compact && question.helpText && !answered && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>Help:</strong> {question.helpText}
          </Text>
        </div>
      )}

      {/* Example Answer */}
      {!compact && question.exampleAnswer && !answered && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
            <strong>Example:</strong> {question.exampleAnswer}
          </Text>
        </div>
      )}

      {/* Related Information */}
      {!compact && (question.relatedEntityId || question.relatedTransactionIds.length > 0) && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ marginBottom: 12 }}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12 }}>
                Related Information:
              </Text>
              {question.relatedEntityId && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Entity: {question.relatedEntityId}
                </Text>
              )}
              {question.relatedTransactionIds.length > 0 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Transactions: {question.relatedTransactionIds.length} transaction(s)
                </Text>
              )}
              {question.relatedReconciliationId && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Reconciliation: {question.relatedReconciliationId}
                </Text>
              )}
            </Space>
          </div>
        </>
      )}

      {/* Answer Display */}
      {showAnswer && answered && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div
            style={{
              backgroundColor: '#f0f5ff',
              padding: 12,
              borderRadius: 4,
              border: '1px solid #d6e4ff',
            }}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 12 }}>
                Answer:
              </Text>
              <Text style={{ fontSize: 13 }}>
                {formatAnswerForDisplay(question.answer, question.answerType)}
              </Text>
              {question.answeredAt && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Answered on {new Date(question.answeredAt).toLocaleString()}
                </Text>
              )}
            </Space>
          </div>
        </>
      )}

      {/* Metadata Footer */}
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size={12} wrap>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Triggered by: <Text strong style={{ fontSize: 11 }}>{question.triggeredBy}</Text>
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Created: {new Date(question.createdAt).toLocaleDateString()}
          </Text>
        </Space>

        {/* Answer Button */}
        {!answered && !expired && onAnswer && (
          <div>
            <a onClick={() => onAnswer(question.id)} style={{ fontSize: 13, fontWeight: 500 }}>
              Answer Question →
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuestionCard;
