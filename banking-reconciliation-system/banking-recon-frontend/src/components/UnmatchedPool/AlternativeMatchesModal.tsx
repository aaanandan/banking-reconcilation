import React, { useState } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  Divider,
  Alert,
  Empty,
} from 'antd';
import {
  SwapOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { AlternativeMatch } from '../../utils/unmatchedPoolUtils';
import { Transaction } from '../../types/transaction';
import {
  formatTransactionDate,
  getTransactionAmount,
  getSourceLabel,
} from '../../types/transaction';
import { getConfidenceLevelColor } from '../../utils/matchApprovalUtils';

const { Text, Title } = Typography;

interface AlternativeMatchesModalProps {
  visible: boolean;
  onClose: () => void;
  sourceTransaction: Transaction;
  alternatives: AlternativeMatch[];
  onCreateMatch: (sourceId: string, targetId: string, confidence: number) => void;
}

/**
 * Modal for viewing and selecting alternative matches
 */
export const AlternativeMatchesModal: React.FC<AlternativeMatchesModalProps> = ({
  visible,
  onClose,
  sourceTransaction,
  alternatives,
  onCreateMatch,
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeMatch | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const sourceAmount = getTransactionAmount(sourceTransaction);

  const handleSelectAlternative = (alternative: AlternativeMatch) => {
    setSelectedAlternative(alternative);
    setShowComparison(true);
  };

  const handleCreateMatch = () => {
    if (selectedAlternative) {
      onCreateMatch(
        sourceTransaction.id,
        selectedAlternative.transaction.id,
        selectedAlternative.confidence
      );
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedAlternative(null);
    setShowComparison(false);
    onClose();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#52c41a';
    if (score >= 75) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          <span>Alternative Matches</span>
          <Tag color="blue">{alternatives.length} found</Tag>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Source Transaction ({getSourceLabel(sourceTransaction.source)})
            </Text>
            <Text strong style={{ fontSize: 14 }}>
              {sourceTransaction.description}
            </Text>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatTransactionDate(sourceTransaction.date)}
              </Text>
              <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
                ${sourceAmount.toFixed(2)}
              </Text>
            </div>
          </Space>
        </Card>
      </div>

      {alternatives.length === 0 ? (
        <Empty description="No alternative matches found" />
      ) : (
        <>
          {!showComparison ? (
            // List of alternatives
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {alternatives.map((alt, index) => {
                  const altAmount = getTransactionAmount(alt.transaction);
                  const confidenceColor = getConfidenceLevelColor(
                    alt.confidence >= 85 ? 'high' : alt.confidence >= 65 ? 'medium' : 'low'
                  );

                  return (
                    <Card
                      key={alt.transaction.id}
                      size="small"
                      style={{
                        border: `1px solid ${confidenceColor}`,
                        cursor: 'pointer',
                      }}
                      hoverable
                      onClick={() => handleSelectAlternative(alt)}
                    >
                      {/* Confidence Badge */}
                      <div style={{ marginBottom: 8 }}>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space size="small">
                              <Text strong style={{ fontSize: 12 }}>
                                Match #{index + 1}
                              </Text>
                              <Tag color={confidenceColor}>{alt.confidence}%</Tag>
                            </Space>
                          </Col>
                          <Col>
                            <Tag color="default">{getSourceLabel(alt.transaction.source)}</Tag>
                          </Col>
                        </Row>
                      </div>

                      {/* Progress Bar */}
                      <Progress
                        percent={alt.confidence}
                        strokeColor={confidenceColor}
                        size="small"
                        showInfo={false}
                        style={{ marginBottom: 8 }}
                      />

                      {/* Transaction Details */}
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text strong>{alt.transaction.description}</Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTransactionDate(alt.transaction.date)}
                          </Text>
                          <Text strong style={{ color: '#52c41a' }}>
                            ${altAmount.toFixed(2)}
                          </Text>
                        </div>
                        {alt.transaction.reference && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Ref: {alt.transaction.reference}
                          </Text>
                        )}
                      </Space>

                      {/* Match Scores */}
                      <Divider style={{ margin: '8px 0' }} />
                      <Row gutter={8}>
                        <Col span={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                              Amount
                            </Text>
                            <Tag color={getScoreColor(alt.scores.amount)} style={{ fontSize: 10 }}>
                              {alt.scores.amount}%
                            </Tag>
                          </div>
                        </Col>
                        <Col span={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                              Date
                            </Text>
                            <Tag color={getScoreColor(alt.scores.date)} style={{ fontSize: 10 }}>
                              {alt.scores.date}%
                            </Tag>
                          </div>
                        </Col>
                        <Col span={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                              Desc
                            </Text>
                            <Tag color={getScoreColor(alt.scores.description)} style={{ fontSize: 10 }}>
                              {alt.scores.description}%
                            </Tag>
                          </div>
                        </Col>
                        <Col span={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                              Ref
                            </Text>
                            <Tag color={getScoreColor(alt.scores.reference)} style={{ fontSize: 10 }}>
                              {alt.scores.reference}%
                            </Tag>
                          </div>
                        </Col>
                      </Row>

                      {/* Match Reasons */}
                      {alt.reasons.length > 0 && (
                        <>
                          <Divider style={{ margin: '8px 0' }} />
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Reasons: {alt.reasons.join(', ')}
                            </Text>
                          </div>
                        </>
                      )}

                      {/* Action Button */}
                      <div style={{ marginTop: 8, textAlign: 'right' }}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAlternative(alt);
                          }}
                        >
                          Select & Compare
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </Space>
            </div>
          ) : (
            // Side-by-side comparison
            <div>
              <Alert
                message={`Match Confidence: ${selectedAlternative?.confidence}%`}
                type={
                  selectedAlternative!.confidence >= 85
                    ? 'success'
                    : selectedAlternative!.confidence >= 65
                    ? 'info'
                    : 'warning'
                }
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
              />

              <Row gutter={16}>
                {/* Source Transaction */}
                <Col span={11}>
                  <Title level={5}>Source Transaction</Title>
                  <Card size="small">
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {getSourceLabel(sourceTransaction.source)}
                        </Text>
                      </div>
                      <div>
                        <Text strong>{sourceTransaction.description}</Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <Row>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            Date
                          </Text>
                          <Text>{formatTransactionDate(sourceTransaction.date)}</Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            Amount
                          </Text>
                          <Text strong style={{ color: '#52c41a' }}>
                            ${sourceAmount.toFixed(2)}
                          </Text>
                        </Col>
                      </Row>
                      {sourceTransaction.reference && (
                        <>
                          <Divider style={{ margin: '8px 0' }} />
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Reference: {sourceTransaction.reference}
                            </Text>
                          </div>
                        </>
                      )}
                    </Space>
                  </Card>
                </Col>

                {/* Match Indicator */}
                <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SwapOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                </Col>

                {/* Target Transaction */}
                <Col span={11}>
                  <Title level={5}>Matched Transaction</Title>
                  <Card size="small">
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {getSourceLabel(selectedAlternative!.transaction.source)}
                        </Text>
                      </div>
                      <div>
                        <Text strong>{selectedAlternative!.transaction.description}</Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <Row>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            Date
                          </Text>
                          <Text>{formatTransactionDate(selectedAlternative!.transaction.date)}</Text>
                        </Col>
                        <Col span={12}>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            Amount
                          </Text>
                          <Text strong style={{ color: '#52c41a' }}>
                            ${getTransactionAmount(selectedAlternative!.transaction).toFixed(2)}
                          </Text>
                        </Col>
                      </Row>
                      {selectedAlternative!.transaction.reference && (
                        <>
                          <Divider style={{ margin: '8px 0' }} />
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Reference: {selectedAlternative!.transaction.reference}
                            </Text>
                          </div>
                        </>
                      )}
                    </Space>
                  </Card>
                </Col>
              </Row>

              {/* Match Reasons */}
              {selectedAlternative!.reasons.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ fontSize: 12 }}>
                    Match Reasons:
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Space size={4} wrap>
                      {selectedAlternative!.reasons.map((reason, idx) => (
                        <Tag key={idx} color="blue" style={{ fontSize: 11 }}>
                          {reason}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setShowComparison(false)}>Back to List</Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleCreateMatch}>
                    Create Match ({selectedAlternative!.confidence}%)
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default AlternativeMatchesModal;
