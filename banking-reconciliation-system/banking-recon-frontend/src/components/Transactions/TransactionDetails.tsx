import React from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Timeline,
  Alert,
  Button,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  LinkOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  Transaction,
  getTransactionAmount,
  formatTransactionDate,
  getStatusColor,
  getStatusLabel,
  getSourceLabel,
  isDebit,
} from '../../types/transaction';

const { Text, Title } = Typography;

interface TransactionDetailsProps {
  transaction: Transaction;
  matchedTransaction?: Transaction;  // If this transaction is matched
  onMatch?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

/**
 * Transaction details component
 * Displays detailed information about a single transaction
 */
export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  matchedTransaction,
  onMatch,
  onApprove,
  onReject,
  showActions = true,
}) => {
  const amount = getTransactionAmount(transaction);
  const isDebitTxn = isDebit(transaction);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Header */}
      <Card size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              {transaction.description}
            </Title>
            <Tag color={getStatusColor(transaction.status)}>
              {getStatusLabel(transaction.status)}
            </Tag>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <CalendarOutlined />
              <Text>{formatTransactionDate(transaction.date)}</Text>
            </Space>
            <Text
              strong
              style={{
                fontSize: 20,
                color: isDebitTxn ? '#ff4d4f' : '#52c41a',
              }}
            >
              {isDebitTxn ? '-' : '+'}${amount.toFixed(2)}
            </Text>
          </div>
        </Space>
      </Card>

      {/* Basic Details */}
      <Card title={<><FileTextOutlined /> Transaction Details</>} size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Transaction ID">
            <Text code>{transaction.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {formatTransactionDate(transaction.date)}
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            <Text strong style={{ color: isDebitTxn ? '#ff4d4f' : '#52c41a' }}>
              {isDebitTxn ? '-' : '+'}${amount.toFixed(2)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag color={isDebitTxn ? 'red' : 'green'}>
              {isDebitTxn ? 'Debit' : 'Credit'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {transaction.description}
          </Descriptions.Item>
          {transaction.reference && (
            <Descriptions.Item label="Reference" span={2}>
              <Text code>{transaction.reference}</Text>
            </Descriptions.Item>
          )}
          {transaction.payee && (
            <Descriptions.Item label="Payee">
              {transaction.payee}
            </Descriptions.Item>
          )}
          {transaction.category && (
            <Descriptions.Item label="Category">
              <Tag>{transaction.category}</Tag>
            </Descriptions.Item>
          )}
          {transaction.balance !== undefined && (
            <Descriptions.Item label="Balance">
              ${transaction.balance.toFixed(2)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Source">
            {getSourceLabel(transaction.source)}
          </Descriptions.Item>
          <Descriptions.Item label="Upload ID">
            <Text code>{transaction.uploadId}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Matching Info */}
      {transaction.matchId && (
        <Card title={<><LinkOutlined /> Match Information</>} size="small">
          {matchedTransaction ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Alert
                message="Matched Transaction Found"
                description={
                  <Space direction="vertical" size="small">
                    <div>
                      <Text strong>Description:</Text> {matchedTransaction.description}
                    </div>
                    <div>
                      <Text strong>Amount:</Text> $
                      {getTransactionAmount(matchedTransaction).toFixed(2)}
                    </div>
                    <div>
                      <Text strong>Date:</Text>{' '}
                      {formatTransactionDate(matchedTransaction.date)}
                    </div>
                    <div>
                      <Text strong>Source:</Text>{' '}
                      {getSourceLabel(matchedTransaction.source)}
                    </div>
                  </Space>
                }
                type="success"
                icon={<CheckCircleOutlined />}
              />
              {transaction.matchConfidence && (
                <div>
                  <Text type="secondary">Match Confidence: </Text>
                  <Text strong>{transaction.matchConfidence}%</Text>
                </div>
              )}
            </Space>
          ) : (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Match ID">
                <Text code>{transaction.matchId}</Text>
              </Descriptions.Item>
              {transaction.matchConfidence && (
                <Descriptions.Item label="Confidence">
                  {transaction.matchConfidence}%
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Card>
      )}

      {/* Audit Trail */}
      <Card title={<><ClockCircleOutlined /> Audit Trail</>} size="small">
        <Timeline
          items={[
            {
              children: (
                <Space direction="vertical" size={0}>
                  <Text strong>Created</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    By: {transaction.createdBy}
                  </Text>
                </Space>
              ),
            },
            ...(transaction.reviewedAt
              ? [
                  {
                    children: (
                      <Space direction="vertical" size={0}>
                        <Text strong>Reviewed</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(transaction.reviewedAt).toLocaleString()}
                        </Text>
                        {transaction.reviewedBy && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            By: {transaction.reviewedBy}
                          </Text>
                        )}
                      </Space>
                    ),
                  },
                ]
              : []),
            {
              children: (
                <Space direction="vertical" size={0}>
                  <Text strong>Last Updated</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(transaction.updatedAt).toLocaleString()}
                  </Text>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Raw Data */}
      {transaction.rawData && Object.keys(transaction.rawData).length > 0 && (
        <Card title="Raw Data" size="small">
          <Descriptions column={1} size="small">
            {Object.entries(transaction.rawData).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                <Text code>{String(value)}</Text>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      )}

      {/* Actions */}
      {showActions && (
        <Card size="small">
          <Space wrap>
            {onMatch && transaction.status === 'reviewed' && (
              <Button type="primary" icon={<LinkOutlined />} onClick={onMatch}>
                Find Match
              </Button>
            )}
            {onApprove && transaction.status === 'matched' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={onApprove}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Approve Match
              </Button>
            )}
            {onReject && transaction.status === 'matched' && (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={onReject}
              >
                Reject Match
              </Button>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default TransactionDetails;
