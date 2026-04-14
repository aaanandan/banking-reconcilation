import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Checkbox, Tooltip, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  EyeOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  Transaction,
  TransactionSortConfig,
  getTransactionAmount,
  getTransactionDisplayAmount,
  formatTransactionDate,
  getStatusColor,
  getStatusLabel,
  getSourceLabel,
  isDebit,
} from '../../types/transaction';

const { Text } = Typography;

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onViewDetails?: (transaction: Transaction) => void;
  onMatch?: (transaction: Transaction) => void;
  onApprove?: (transaction: Transaction) => void;
  onReject?: (transaction: Transaction) => void;
  sortConfig?: TransactionSortConfig;
  onSortChange?: (sortConfig: TransactionSortConfig) => void;
  pagination?: TablePaginationConfig;
  onPaginationChange?: (pagination: TablePaginationConfig) => void;
  showSelection?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Transaction list table component
 * Displays transactions with sorting, filtering, and actions
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
  selectedIds = [],
  onSelectionChange,
  onViewDetails,
  onMatch,
  onApprove,
  onReject,
  sortConfig,
  onSortChange,
  pagination,
  onPaginationChange,
  showSelection = true,
  showActions = true,
  compact = false,
}) => {
  const columns: ColumnsType<Transaction> = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        sorter: true,
        render: (date: string) => (
          <Text>{formatTransactionDate(date)}</Text>
        ),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (description: string, record: Transaction) => (
          <Tooltip title={description}>
            <div>
              <Text strong>{description}</Text>
              {record.reference && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Ref: {record.reference}
                  </Text>
                </div>
              )}
            </div>
          </Tooltip>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 130,
        align: 'right',
        sorter: true,
        render: (_: any, record: Transaction) => {
          const amount = getTransactionAmount(record);
          const isDebitTxn = isDebit(record);

          return (
            <Text
              strong
              style={{
                color: isDebitTxn ? '#ff4d4f' : '#52c41a',
              }}
            >
              {isDebitTxn ? '-' : '+'}${amount.toFixed(2)}
            </Text>
          );
        },
      },
      {
        title: 'Type',
        dataIndex: 'transactionType',
        key: 'transactionType',
        width: 90,
        align: 'center',
        render: (_: any, record: Transaction) => (
          <Tag color={isDebit(record) ? 'red' : 'green'}>
            {isDebit(record) ? 'Debit' : 'Credit'}
          </Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        align: 'center',
        render: (status: string) => (
          <Tag color={getStatusColor(status as any)}>
            {getStatusLabel(status as any)}
          </Tag>
        ),
      },
      {
        title: 'Source',
        dataIndex: 'source',
        key: 'source',
        width: 130,
        render: (source: string) => (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getSourceLabel(source as any)}
          </Text>
        ),
      },
      ...(record.matchId
        ? [
            {
              title: 'Match',
              key: 'match',
              width: 100,
              align: 'center' as const,
              render: (_: any, record: Transaction) => (
                <Space size={4}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  {record.matchConfidence && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {record.matchConfidence}%
                    </Text>
                  )}
                </Space>
              ),
            },
          ]
        : []),
      ...(showActions
        ? [
            {
              title: 'Actions',
              key: 'actions',
              width: compact ? 120 : 180,
              fixed: 'right' as const,
              render: (_: any, record: Transaction) => (
                <Space size="small">
                  {onViewDetails && (
                    <Tooltip title="View Details">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onViewDetails(record)}
                      />
                    </Tooltip>
                  )}
                  {onMatch && record.status === 'reviewed' && (
                    <Tooltip title="Find Match">
                      <Button
                        type="text"
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => onMatch(record)}
                      />
                    </Tooltip>
                  )}
                  {onApprove && record.status === 'matched' && (
                    <Tooltip title="Approve">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        style={{ color: '#52c41a' }}
                        onClick={() => onApprove(record)}
                      />
                    </Tooltip>
                  )}
                  {onReject && record.status === 'matched' && (
                    <Tooltip title="Reject">
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseCircleOutlined />}
                        style={{ color: '#ff4d4f' }}
                        onClick={() => onReject(record)}
                      />
                    </Tooltip>
                  )}
                </Space>
              ),
            },
          ]
        : []),
    ],
    [
      onViewDetails,
      onMatch,
      onApprove,
      onReject,
      showActions,
      compact,
    ]
  );

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    _filters: any,
    sorter: any
  ) => {
    // Handle pagination
    if (onPaginationChange) {
      onPaginationChange(newPagination);
    }

    // Handle sorting
    if (onSortChange && sorter.field) {
      onSortChange({
        field: sorter.field,
        order: sorter.order === 'ascend' ? 'asc' : 'desc',
      });
    }
  };

  const rowSelection = showSelection
    ? {
        selectedRowKeys: selectedIds,
        onChange: (selectedRowKeys: React.Key[]) => {
          if (onSelectionChange) {
            onSelectionChange(selectedRowKeys as string[]);
          }
        },
      }
    : undefined;

  return (
    <Table<Transaction>
      columns={columns}
      dataSource={transactions}
      rowKey="id"
      loading={loading}
      rowSelection={rowSelection}
      pagination={pagination}
      onChange={handleTableChange}
      size={compact ? 'small' : 'middle'}
      scroll={{ x: 'max-content' }}
      sticky
    />
  );
};

export default TransactionList;
