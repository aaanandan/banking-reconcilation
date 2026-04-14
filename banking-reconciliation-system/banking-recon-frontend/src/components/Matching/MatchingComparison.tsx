import React from 'react';
import { Card, Row, Col, Descriptions, Tag, Alert, Space, Typography, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Transaction } from '../../types/transaction';
import {
  getTransactionAmount,
  formatTransactionDate,
  getSourceLabel,
  isDebit,
} from '../../types/transaction';
import { FieldScores } from '../../utils/matchingAlgorithms';

const { Text, Title } = Typography;

interface MatchingComparisonProps {
  sourceTransaction: Transaction;
  targetTransaction: Transaction;
  fieldScores: FieldScores;
  overallScore: number;
}

/**
 * Side-by-side comparison of two transactions
 */
export const MatchingComparison: React.FC<MatchingComparisonProps> = ({
  sourceTransaction,
  targetTransaction,
  fieldScores,
  overallScore,
}) => {
  const getFieldIcon = (score: number) => {
    if (score >= 90) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (score >= 70) return <WarningOutlined style={{ color: '#faad14' }} />;
    return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getFieldColor = (score: number): string => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const sourceAmount = getTransactionAmount(sourceTransaction);
  const targetAmount = getTransactionAmount(targetTransaction);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Overall Score */}
      <Card size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Overall Match Confidence</Text>
            <Tag
              color={getFieldColor(overallScore)}
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              {Math.round(overallScore)}%
            </Tag>
          </div>
          {overallScore >= 90 && (
            <Alert
              message="High Confidence Match"
              description="This is a very strong match. You can auto-approve this."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}
          {overallScore >= 70 && overallScore < 90 && (
            <Alert
              message="Good Match"
              description="This looks like a valid match. Review the details before approving."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          )}
          {overallScore < 70 && (
            <Alert
              message="Low Confidence Match"
              description="This match has low confidence. Review carefully before approving."
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
            />
          )}
        </Space>
      </Card>

      {/* Field-by-Field Comparison */}
      <Card title="Field Comparison" size="small">
        <Row gutter={[16, 16]}>
          {/* Amount */}
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                {getFieldIcon(fieldScores.amount)}
                <Text strong>Amount</Text>
                <Tag color={getFieldColor(fieldScores.amount)}>
                  {Math.round(fieldScores.amount)}%
                </Tag>
              </Space>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Text type="secondary">Source ({getSourceLabel(sourceTransaction.source)})</Text>
                  <div>
                    <Text strong style={{ fontSize: 18, color: isDebit(sourceTransaction) ? '#ff4d4f' : '#52c41a' }}>
                      ${sourceAmount.toFixed(2)}
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Text type="secondary">Target ({getSourceLabel(targetTransaction.source)})</Text>
                  <div>
                    <Text strong style={{ fontSize: 18, color: isDebit(targetTransaction) ? '#ff4d4f' : '#52c41a' }}>
                      ${targetAmount.toFixed(2)}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>

          <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>

          {/* Date */}
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                {getFieldIcon(fieldScores.date)}
                <Text strong>Date</Text>
                <Tag color={getFieldColor(fieldScores.date)}>
                  {Math.round(fieldScores.date)}%
                </Tag>
              </Space>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Text>{formatTransactionDate(sourceTransaction.date)}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Text>{formatTransactionDate(targetTransaction.date)}</Text>
                </Card>
              </Col>
            </Row>
          </Col>

          <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>

          {/* Description */}
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                {getFieldIcon(fieldScores.description)}
                <Text strong>Description</Text>
                <Tag color={getFieldColor(fieldScores.description)}>
                  {Math.round(fieldScores.description)}%
                </Tag>
              </Space>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Text>{sourceTransaction.description}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Text>{targetTransaction.description}</Text>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Reference (if available) */}
          {(sourceTransaction.reference || targetTransaction.reference) && (
            <>
              <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>
              <Col span={24}>
                <div style={{ marginBottom: 8 }}>
                  <Space>
                    {getFieldIcon(fieldScores.reference)}
                    <Text strong>Reference</Text>
                    <Tag color={getFieldColor(fieldScores.reference)}>
                      {Math.round(fieldScores.reference)}%
                    </Tag>
                  </Space>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                      <Text>{sourceTransaction.reference || '-'}</Text>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                      <Text>{targetTransaction.reference || '-'}</Text>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </>
          )}
        </Row>
      </Card>

      {/* Additional Details */}
      <Card title="Additional Information" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions column={1} size="small" title={getSourceLabel(sourceTransaction.source)}>
              {sourceTransaction.payee && (
                <Descriptions.Item label="Payee">{sourceTransaction.payee}</Descriptions.Item>
              )}
              {sourceTransaction.category && (
                <Descriptions.Item label="Category">
                  <Tag>{sourceTransaction.category}</Tag>
                </Descriptions.Item>
              )}
              {sourceTransaction.balance !== undefined && (
                <Descriptions.Item label="Balance">
                  ${sourceTransaction.balance.toFixed(2)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small" title={getSourceLabel(targetTransaction.source)}>
              {targetTransaction.payee && (
                <Descriptions.Item label="Payee">{targetTransaction.payee}</Descriptions.Item>
              )}
              {targetTransaction.category && (
                <Descriptions.Item label="Category">
                  <Tag>{targetTransaction.category}</Tag>
                </Descriptions.Item>
              )}
              {targetTransaction.balance !== undefined && (
                <Descriptions.Item label="Balance">
                  ${targetTransaction.balance.toFixed(2)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};

export default MatchingComparison;
