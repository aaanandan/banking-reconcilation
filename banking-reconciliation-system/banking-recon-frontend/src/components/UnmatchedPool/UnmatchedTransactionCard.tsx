import React from 'react';
import { Card, Tag, Button, Space, Typography, Tooltip, Badge } from 'antd';
import {
  ThunderboltOutlined,
  EyeOutlined,
  LinkOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { UnmatchedTransaction } from '../../utils/unmatchedPoolUtils';
import {
  getUrgencyLevel,
  getUrgencyColor,
  getUrgencyLabel,
  getRecommendedAction,
  getActionLabel,
  getActionColor,
} from '../../utils/unmatchedPoolUtils';
import {
  formatTransactionDate,
  getTransactionAmount,
  getSourceLabel,
} from '../../types/transaction';

const { Text } = Typography;

interface UnmatchedTransactionCardProps {
  unmatched: UnmatchedTransaction;
  onViewAlternatives?: (transactionId: string) => void;
  onManualMatch?: (transactionId: string) => void;
  selected?: boolean;
  onSelect?: (transactionId: string, selected: boolean) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Card displaying an unmatched transaction
 */
export const UnmatchedTransactionCard: React.FC<UnmatchedTransactionCardProps> = ({
  unmatched,
  onViewAlternatives,
  onManualMatch,
  selected = false,
  onSelect,
  showActions = true,
  compact = false,
}) => {
  const { transaction, daysUnmatched, alternativeMatches, hasHighConfidenceAlternative } = unmatched;

  const urgency = getUrgencyLevel(daysUnmatched);
  const urgencyColor = getUrgencyColor(urgency);
  const recommendedAction = getRecommendedAction(unmatched);

  const amount = getTransactionAmount(transaction);
  const isDebit = transaction.amount < 0;

  return (
    <Card
      size="small"
      style={{
        border: selected ? '2px solid #1890ff' : `1px solid ${urgencyColor}`,
        backgroundColor: selected ? '#f0f7ff' : '#fff',
        marginBottom: compact ? 8 : 12,
        borderLeft: `4px solid ${urgencyColor}`,
      }}
      bodyStyle={{ padding: compact ? 12 : 16 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="small">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect(transaction.id, e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <Tag color="default">{getSourceLabel(transaction.source)}</Tag>
              <Tooltip title={getUrgencyLabel(urgency)}>
                <Tag color={urgencyColor} icon={<ClockCircleOutlined />}>
                  {daysUnmatched} days
                </Tag>
              </Tooltip>
              {hasHighConfidenceAlternative && (
                <Tooltip title="High confidence alternative available">
                  <Tag color="green" icon={<ThunderboltOutlined />}>
                    Auto-Match
                  </Tag>
                </Tooltip>
              )}
            </Space>
            <Tag color={getActionColor(recommendedAction)}>
              {getActionLabel(recommendedAction)}
            </Tag>
          </div>
        </Space>
      </div>

      {/* Transaction Details */}
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* Description */}
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {transaction.description}
          </Text>
        </div>

        {/* Date and Amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16}>
            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                Date
              </Text>
              <Text style={{ fontSize: 13 }}>
                {formatTransactionDate(transaction.date)}
              </Text>
            </div>
            {transaction.payee && (
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  Payee
                </Text>
                <Text style={{ fontSize: 13 }}>{transaction.payee}</Text>
              </div>
            )}
            {transaction.reference && (
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  Reference
                </Text>
                <Text style={{ fontSize: 13 }}>{transaction.reference}</Text>
              </div>
            )}
          </Space>

          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              Amount
            </Text>
            <Text
              strong
              style={{
                fontSize: 16,
                color: isDebit ? '#ff4d4f' : '#52c41a',
              }}
            >
              {isDebit ? '-' : '+'}${amount.toFixed(2)}
            </Text>
          </div>
        </div>

        {/* Category and Balance (if available) */}
        {!compact && (transaction.category || transaction.balance !== undefined) && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {transaction.category && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Category: <Text style={{ fontSize: 12 }}>{transaction.category}</Text>
                </Text>
              </div>
            )}
            {transaction.balance !== undefined && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Balance: <Text style={{ fontSize: 12 }}>${transaction.balance.toFixed(2)}</Text>
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Alternative Matches Summary */}
        {alternativeMatches.length > 0 && (
          <div
            style={{
              backgroundColor: '#f0f5ff',
              padding: 8,
              borderRadius: 4,
              border: '1px solid #d6e4ff',
            }}
          >
            <Space size={8}>
              <Badge count={alternativeMatches.length} showZero color="#1890ff" />
              <Text style={{ fontSize: 12 }}>
                {alternativeMatches.length === 1
                  ? '1 alternative match found'
                  : `${alternativeMatches.length} alternative matches found`}
              </Text>
              {hasHighConfidenceAlternative && (
                <Tag color="green" style={{ fontSize: 11 }}>
                  High Confidence
                </Tag>
              )}
            </Space>
          </div>
        )}

        {/* No Alternatives Warning */}
        {alternativeMatches.length === 0 && daysUnmatched >= 30 && (
          <div
            style={{
              backgroundColor: '#fff7e6',
              padding: 8,
              borderRadius: 4,
              border: '1px solid #ffd591',
            }}
          >
            <Space size={4}>
              <WarningOutlined style={{ color: '#faad14' }} />
              <Text style={{ fontSize: 12, color: '#ad6800' }}>
                No alternative matches found - manual intervention required
              </Text>
            </Space>
          </div>
        )}
      </Space>

      {/* Actions */}
      {showActions && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            {alternativeMatches.length > 0 && onViewAlternatives && (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewAlternatives(transaction.id)}
                type={hasHighConfidenceAlternative ? 'primary' : 'default'}
              >
                View Alternatives ({alternativeMatches.length})
              </Button>
            )}
            {onManualMatch && (
              <Button
                size="small"
                icon={<LinkOutlined />}
                onClick={() => onManualMatch(transaction.id)}
              >
                Manual Match
              </Button>
            )}
          </Space>
        </div>
      )}

      {/* Urgency Warning for Critical Items */}
      {urgency === 'critical' && !compact && (
        <div
          style={{
            marginTop: 12,
            backgroundColor: '#fff2f0',
            padding: 8,
            borderRadius: 4,
            border: '1px solid #ffccc7',
          }}
        >
          <Space size={4}>
            <WarningOutlined style={{ color: '#cf1322' }} />
            <Text style={{ fontSize: 12, color: '#cf1322' }}>
              <strong>Critical:</strong> Unmatched for {daysUnmatched} days - requires immediate attention
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default UnmatchedTransactionCard;
