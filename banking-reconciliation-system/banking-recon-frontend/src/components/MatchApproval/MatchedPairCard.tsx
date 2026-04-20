import React from 'react';
import { Card, Row, Col, Tag, Button, Space, Typography, Divider, Progress, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { MatchedPair } from '../../utils/matchApprovalUtils';
import {
  getConfidenceLevel,
  getConfidenceLevelColor,
  getConfidenceLevelLabel,
  getMatchTypeLabel,
  getMatchTypeColor,
  getApprovalStatusColor,
  getApprovalStatusLabel,
  calculateMatchDifferences,
} from '../../utils/matchApprovalUtils';
import {
  formatTransactionDate,
  getTransactionAmount,
  getSourceLabel,
} from '../../types/transaction';

const { Text } = Typography;

interface MatchedPairCardProps {
  pair: MatchedPair;
  onApprove?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onViewDetails?: (matchId: string) => void;
  selected?: boolean;
  onSelect?: (matchId: string, selected: boolean) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Card displaying a matched pair of transactions
 */
export const MatchedPairCard: React.FC<MatchedPairCardProps> = ({
  pair,
  onApprove,
  onReject,
  onViewDetails,
  selected = false,
  onSelect,
  showActions = true,
  compact = false,
}) => {
  const { match, bankTransaction, ledgerTransaction } = pair;
  const confidenceLevel = getConfidenceLevel(match.matchConfidence);
  const differences = calculateMatchDifferences(bankTransaction, ledgerTransaction);

  const bankAmount = getTransactionAmount(bankTransaction);
  const ledgerAmount = getTransactionAmount(ledgerTransaction);

  return (
    <Card
      size="small"
      style={{
        border: selected ? '2px solid #1890ff' : '1px solid #f0f0f0',
        backgroundColor: selected ? '#f0f7ff' : '#fff',
        marginBottom: compact ? 8 : 12,
      }}
      bodyStyle={{ padding: compact ? 12 : 16 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="small">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect(match.id, e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <Tag color={getMatchTypeColor(match.matchType)}>
                {getMatchTypeLabel(match.matchType)}
              </Tag>
              <Tag color={getApprovalStatusColor(match.status as any)}>
                {getApprovalStatusLabel(match.status as any)}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Confidence:
              </Text>
              <Tag color={getConfidenceLevelColor(confidenceLevel)}>
                {match.matchConfidence}%
              </Tag>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Confidence Progress */}
      {!compact && (
        <div style={{ marginBottom: 12 }}>
          <Progress
            percent={match.matchConfidence}
            strokeColor={getConfidenceLevelColor(confidenceLevel)}
            size="small"
            showInfo={false}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {getConfidenceLevelLabel(confidenceLevel)}
          </Text>
        </div>
      )}

      {/* Matched Transactions */}
      <Row gutter={16}>
        {/* Bank Transaction */}
        <Col span={11}>
          <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {getSourceLabel(bankTransaction.source)}
                </Text>
              </div>
              <div>
                <Text strong>{bankTransaction.description}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatTransactionDate(bankTransaction.date)}
                </Text>
                <Text strong style={{ color: '#52c41a' }}>
                  ${bankAmount.toFixed(2)}
                </Text>
              </div>
              {bankTransaction.reference && (
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Ref: {bankTransaction.reference}
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* Match Indicator */}
        <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SwapOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        </Col>

        {/* Ledger Transaction */}
        <Col span={11}>
          <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {getSourceLabel(ledgerTransaction.source)}
                </Text>
              </div>
              <div>
                <Text strong>{ledgerTransaction.description}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatTransactionDate(ledgerTransaction.date)}
                </Text>
                <Text strong style={{ color: '#52c41a' }}>
                  ${ledgerAmount.toFixed(2)}
                </Text>
              </div>
              {ledgerTransaction.reference && (
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Ref: {ledgerTransaction.reference}
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Differences Warning */}
      {!compact && (differences.amountDiff > 0 || differences.dateDiff > 0) && (
        <div style={{ marginTop: 12 }}>
          <Space size={4} wrap>
            {differences.amountDiff > 0 && (
              <Tooltip title={`Amount difference: $${differences.amountDiff.toFixed(2)}`}>
                <Tag icon={<InfoCircleOutlined />} color="warning" style={{ fontSize: 11 }}>
                  Δ Amount
                </Tag>
              </Tooltip>
            )}
            {differences.dateDiff > 0 && (
              <Tooltip title={`Date difference: ${Math.round(differences.dateDiff)} day(s)`}>
                <Tag icon={<InfoCircleOutlined />} color="warning" style={{ fontSize: 11 }}>
                  Δ Date
                </Tag>
              </Tooltip>
            )}
          </Space>
        </div>
      )}

      {/* Match Details */}
      {!compact && match.matchedFields && match.matchedFields.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Matched fields: {match.matchedFields.join(', ')}
          </Text>
        </div>
      )}

      {/* Actions */}
      {showActions && match.status === 'pending' && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Row justify="space-between" align="middle">
            <Col>
              {onViewDetails && (
                <Button
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={() => onViewDetails(match.id)}
                >
                  Details
                </Button>
              )}
            </Col>
            <Col>
              <Space>
                {onReject && (
                  <Button
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => onReject(match.id)}
                  >
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onApprove(match.id)}
                    style={{
                      backgroundColor: confidenceLevel === 'high' ? '#52c41a' : undefined,
                      borderColor: confidenceLevel === 'high' ? '#52c41a' : undefined,
                    }}
                  >
                    Approve
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </>
      )}

      {/* Approval/Rejection Info */}
      {match.status === 'approved' && match.approvedBy && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Approved by {match.approvedBy} on {new Date(match.approvedAt!).toLocaleString()}
          </Text>
        </div>
      )}
      {match.status === 'rejected' && match.rejectedBy && (
        <div style={{ marginTop: 12 }}>
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Rejected by {match.rejectedBy} on {new Date(match.rejectedAt!).toLocaleString()}
            </Text>
            {match.rejectionReason && (
              <Text type="danger" style={{ fontSize: 11 }}>
                Reason: {match.rejectionReason}
              </Text>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default MatchedPairCard;
