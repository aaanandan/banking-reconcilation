import React from 'react';
import { List, Card, Tag, Progress, Space, Button, Typography, Badge, Empty } from 'antd';
import {
  CheckCircleOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { MatchCandidate } from '../../utils/matchingAlgorithms';
import { getTransactionAmount, formatTransactionDate } from '../../types/transaction';

const { Text } = Typography;

interface MatchingCandidatesListProps {
  candidates: MatchCandidate[];
  loading?: boolean;
  selectedCandidateId?: string;
  onSelectCandidate?: (candidate: MatchCandidate) => void;
  onMatchCandidate?: (candidate: MatchCandidate) => void;
  showActions?: boolean;
}

/**
 * List of matching candidates with scores and reasons
 */
export const MatchingCandidatesList: React.FC<MatchingCandidatesListProps> = ({
  candidates,
  loading = false,
  selectedCandidateId,
  onSelectCandidate,
  onMatchCandidate,
  showActions = true,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#52c41a';  // Green
    if (score >= 75) return '#1890ff';  // Blue
    if (score >= 60) return '#faad14';  // Orange
    return '#ff4d4f';  // Red
  };

  const getScoreStatus = (score: number): 'success' | 'normal' | 'exception' => {
    if (score >= 75) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  if (candidates.length === 0) {
    return (
      <Card>
        <Empty
          description="No matching candidates found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <List
      loading={loading}
      dataSource={candidates}
      renderItem={(candidate) => {
        const isSelected = candidate.transaction.id === selectedCandidateId;
        const amount = getTransactionAmount(candidate.transaction);

        return (
          <List.Item
            key={candidate.transaction.id}
            style={{
              border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
              borderRadius: 4,
              marginBottom: 12,
              padding: 16,
              backgroundColor: isSelected ? '#f0f7ff' : '#fff',
              cursor: onSelectCandidate ? 'pointer' : 'default',
            }}
            onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
          >
            <div style={{ width: '100%' }}>
              {/* Header */}
              <div style={{ marginBottom: 12 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{candidate.transaction.description}</Text>
                    <Badge
                      count={`${Math.round(candidate.score)}%`}
                      style={{
                        backgroundColor: getScoreColor(candidate.score),
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTransactionDate(candidate.transaction.date)}
                    </Text>
                    <Text strong style={{ color: getScoreColor(candidate.score) }}>
                      ${amount.toFixed(2)}
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Match Score Progress */}
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 11, marginRight: 8 }}>
                  Match Confidence:
                </Text>
                <Progress
                  percent={Math.round(candidate.score)}
                  size="small"
                  status={getScoreStatus(candidate.score)}
                  strokeColor={getScoreColor(candidate.score)}
                />
              </div>

              {/* Field Scores */}
              <div style={{ marginBottom: 12 }}>
                <Space size={4} wrap>
                  <Tag color={candidate.fieldScores.amount >= 90 ? 'green' : 'default'}>
                    Amount: {Math.round(candidate.fieldScores.amount)}%
                  </Tag>
                  <Tag color={candidate.fieldScores.date >= 90 ? 'green' : 'default'}>
                    Date: {Math.round(candidate.fieldScores.date)}%
                  </Tag>
                  <Tag color={candidate.fieldScores.description >= 70 ? 'green' : 'default'}>
                    Desc: {Math.round(candidate.fieldScores.description)}%
                  </Tag>
                  {candidate.fieldScores.reference > 0 && (
                    <Tag color={candidate.fieldScores.reference >= 80 ? 'green' : 'default'}>
                      Ref: {Math.round(candidate.fieldScores.reference)}%
                    </Tag>
                  )}
                </Space>
              </div>

              {/* Match Reasons */}
              {candidate.matchReasons.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <Space direction="vertical" size={2}>
                    {candidate.matchReasons.map((reason, idx) => (
                      <Text key={idx} type="secondary" style={{ fontSize: 12 }}>
                        • {reason.description}
                      </Text>
                    ))}
                  </Space>
                </div>
              )}

              {/* Actions */}
              {showActions && (
                <div>
                  <Space>
                    {onSelectCandidate && (
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(candidate);
                        }}
                      >
                        Compare
                      </Button>
                    )}
                    {onMatchCandidate && (
                      <Button
                        size="small"
                        type="primary"
                        icon={candidate.score >= 90 ? <ThunderboltOutlined /> : <CheckCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMatchCandidate(candidate);
                        }}
                      >
                        {candidate.score >= 90 ? 'Auto Match' : 'Match'}
                      </Button>
                    )}
                  </Space>
                </div>
              )}
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default MatchingCandidatesList;
