import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Space, Button, Statistic, Drawer, Modal, message } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { TransactionList } from './TransactionList';
import { TransactionFilters } from './TransactionFilters';
import { TransactionDetails } from './TransactionDetails';
import {
  Transaction,
  TransactionFilter,
  TransactionSortConfig,
  TransactionStats,
} from '../../types/transaction';

interface TransactionReviewManagerProps {
  transactions: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
  onMatch?: (transaction: Transaction) => void;
  onApprove?: (transaction: Transaction) => void;
  onReject?: (transaction: Transaction) => void;
  onBulkApprove?: (transactionIds: string[]) => void;
  onBulkReject?: (transactionIds: string[]) => void;
}

/**
 * Transaction Review Manager
 * Complete integration component for reviewing transactions
 */
export const TransactionReviewManager: React.FC<TransactionReviewManagerProps> = ({
  transactions,
  loading = false,
  onRefresh,
  onMatch,
  onApprove,
  onReject,
  onBulkApprove,
  onBulkReject,
}) => {
  // State
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [sortConfig, setSortConfig] = useState<TransactionSortConfig>({
    field: 'date',
    order: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply text search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower) ||
          t.reference?.toLowerCase().includes(searchLower) ||
          t.payee?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filter
    if (filter.dateFrom) {
      result = result.filter((t) => new Date(t.date) >= new Date(filter.dateFrom!));
    }
    if (filter.dateTo) {
      result = result.filter((t) => new Date(t.date) <= new Date(filter.dateTo!));
    }

    // Apply amount filter
    if (filter.amountMin !== undefined) {
      result = result.filter((t) => Math.abs(t.amount) >= filter.amountMin!);
    }
    if (filter.amountMax !== undefined) {
      result = result.filter((t) => Math.abs(t.amount) <= filter.amountMax!);
    }

    // Apply status filter
    if (filter.status && filter.status.length > 0) {
      result = result.filter((t) => filter.status!.includes(t.status));
    }

    // Apply type filter
    if (filter.type && filter.type.length > 0) {
      result = result.filter((t) => filter.type!.includes(t.transactionType));
    }

    // Apply source filter
    if (filter.source && filter.source.length > 0) {
      result = result.filter((t) => filter.source!.includes(t.source));
    }

    // Apply category filter
    if (filter.category && filter.category.length > 0) {
      result = result.filter(
        (t) => t.category && filter.category!.includes(t.category)
      );
    }

    // Apply payee filter
    if (filter.payee && filter.payee.length > 0) {
      result = result.filter((t) => t.payee && filter.payee!.includes(t.payee));
    }

    // Apply matched filter
    if (filter.matched !== undefined) {
      result = result.filter((t) =>
        filter.matched ? t.matchId !== undefined : t.matchId === undefined
      );
    }

    // Apply upload filter
    if (filter.uploadId) {
      result = result.filter((t) => t.uploadId === filter.uploadId);
    }

    return result;
  }, [transactions, filter]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortConfig.order === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredTransactions, sortConfig]);

  // Calculate statistics
  const stats: TransactionStats = useMemo(() => {
    const total = transactions.length;
    const pending = transactions.filter((t) => t.status === 'pending').length;
    const reviewed = transactions.filter((t) => t.status === 'reviewed').length;
    const matched = transactions.filter((t) => t.status === 'matched').length;
    const unmatched = transactions.filter((t) => t.status === 'unmatched').length;
    const approved = transactions.filter((t) => t.status === 'approved').length;
    const rejected = transactions.filter((t) => t.status === 'rejected').length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const matchRate = total > 0 ? ((matched + approved) / total) * 100 : 0;

    return {
      total,
      pending,
      reviewed,
      matched,
      unmatched,
      approved,
      rejected,
      totalAmount,
      matchRate,
    };
  }, [transactions]);

  // Handlers
  const handleViewDetails = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsVisible(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setSelectedTransaction(null);
  }, []);

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      message.warning('Please select transactions to approve');
      return;
    }

    Modal.confirm({
      title: 'Approve Selected Transactions',
      content: `Are you sure you want to approve ${selectedIds.length} transaction(s)?`,
      okText: 'Approve',
      cancelText: 'Cancel',
      onOk: () => {
        if (onBulkApprove) {
          onBulkApprove(selectedIds);
          setSelectedIds([]);
          message.success(`${selectedIds.length} transaction(s) approved`);
        }
      },
    });
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) {
      message.warning('Please select transactions to reject');
      return;
    }

    Modal.confirm({
      title: 'Reject Selected Transactions',
      content: `Are you sure you want to reject ${selectedIds.length} transaction(s)?`,
      okText: 'Reject',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: () => {
        if (onBulkReject) {
          onBulkReject(selectedIds);
          setSelectedIds([]);
          message.success(`${selectedIds.length} transaction(s) rejected`);
        }
      },
    });
  };

  // Extract unique values for filters
  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category).filter(Boolean) as string[])),
    [transactions]
  );

  const payees = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.payee).filter(Boolean) as string[])),
    [transactions]
  );

  const uploadIds = useMemo(() => {
    const uniqueUploads = Array.from(new Set(transactions.map((t) => t.uploadId)));
    return uniqueUploads.map((id) => ({ id, name: `Upload ${id}` }));
  }, [transactions]);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header with Stats */}
        <Card size="small">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Transaction Review</h2>
                <Space>
                  {onRefresh && (
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={onRefresh}
                      loading={loading}
                    >
                      Refresh
                    </Button>
                  )}
                  {selectedIds.length > 0 && (
                    <>
                      <Button
                        icon={<CheckCircleOutlined />}
                        onClick={handleBulkApprove}
                        style={{ color: '#52c41a', borderColor: '#52c41a' }}
                      >
                        Approve ({selectedIds.length})
                      </Button>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={handleBulkReject}
                      >
                        Reject ({selectedIds.length})
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Transactions"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Matched"
                value={stats.matched + stats.approved}
                suffix={`/ ${stats.total}`}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Match Rate"
                value={stats.matchRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: stats.matchRate >= 80 ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Amount"
                value={stats.totalAmount}
                precision={2}
                prefix="$"
              />
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          {/* Filters - Left Column */}
          <Col xs={24} lg={6}>
            <TransactionFilters
              onFilterChange={setFilter}
              initialFilter={filter}
              categories={categories}
              payees={payees}
              uploadIds={uploadIds}
            />
          </Col>

          {/* Transaction List - Right Column */}
          <Col xs={24} lg={18}>
            <Card
              size="small"
              title={`Transactions (${filteredTransactions.length})`}
            >
              <TransactionList
                transactions={sortedTransactions}
                loading={loading}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onViewDetails={handleViewDetails}
                onMatch={onMatch}
                onApprove={onApprove}
                onReject={onReject}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: filteredTransactions.length,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} transactions`,
                }}
                onPaginationChange={(pagination) => {
                  setCurrentPage(pagination.current || 1);
                  setPageSize(pagination.pageSize || 50);
                }}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      {/* Details Drawer */}
      <Drawer
        title="Transaction Details"
        placement="right"
        width={600}
        open={detailsVisible}
        onClose={handleCloseDetails}
      >
        {selectedTransaction && (
          <TransactionDetails
            transaction={selectedTransaction}
            onMatch={() => {
              if (onMatch) {
                onMatch(selectedTransaction);
                handleCloseDetails();
              }
            }}
            onApprove={() => {
              if (onApprove) {
                onApprove(selectedTransaction);
                handleCloseDetails();
              }
            }}
            onReject={() => {
              if (onReject) {
                onReject(selectedTransaction);
                handleCloseDetails();
              }
            }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default TransactionReviewManager;
