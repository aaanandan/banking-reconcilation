import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Statistic,
  Tag,
  Select,
  Spin,
  Empty,
  message,
  Modal,
} from 'antd';
import {
  ReloadOutlined,
  ThunderboltOutlined,
  SortAscendingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { UnmatchedTransactionCard } from './UnmatchedTransactionCard';
import { UnmatchedPoolFilters } from './UnmatchedPoolFilters';
import { AlternativeMatchesModal } from './AlternativeMatchesModal';
import {
  UnmatchedTransaction,
  UnmatchedFilter,
  calculateUnmatchedStats,
  filterUnmatchedTransactions,
  sortUnmatchedTransactions,
  groupByUrgency,
} from '../../utils/unmatchedPoolUtils';
import { Transaction } from '../../types/transaction';

const { Title, Text } = Typography;

interface UnmatchedPoolManagerProps {
  unmatchedTransactions: UnmatchedTransaction[];
  loading?: boolean;
  onRefresh?: () => void;
  onCreateMatch?: (sourceId: string, targetId: string, confidence: number) => void;
  onManualMatch?: (transactionId: string) => void;
}

/**
 * Main Unmatched Pool Management Interface
 */
export const UnmatchedPoolManager: React.FC<UnmatchedPoolManagerProps> = ({
  unmatchedTransactions,
  loading = false,
  onRefresh,
  onCreateMatch,
  onManualMatch,
}) => {
  const [filter, setFilter] = useState<UnmatchedFilter>({});
  const [sortField, setSortField] = useState<'date' | 'amount' | 'daysUnmatched' | 'alternatives'>('daysUnmatched');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [alternativesModalVisible, setAlternativesModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<UnmatchedTransaction | null>(null);

  // Filter and sort transactions
  const filteredAndSorted = useMemo(() => {
    const filtered = filterUnmatchedTransactions(unmatchedTransactions, filter);
    return sortUnmatchedTransactions(filtered, sortField, sortOrder);
  }, [unmatchedTransactions, filter, sortField, sortOrder]);

  // Calculate statistics
  const stats = useMemo(
    () => calculateUnmatchedStats(filteredAndSorted),
    [filteredAndSorted]
  );

  // Group by urgency
  const urgencyGroups = useMemo(
    () => groupByUrgency(filteredAndSorted),
    [filteredAndSorted]
  );

  // Count high confidence alternatives
  const highConfidenceCount = filteredAndSorted.filter(
    (ut) => ut.hasHighConfidenceAlternative
  ).length;

  const handleViewAlternatives = (transactionId: string) => {
    const unmatched = filteredAndSorted.find((ut) => ut.transaction.id === transactionId);
    if (unmatched) {
      setSelectedTransaction(unmatched);
      setAlternativesModalVisible(true);
    }
  };

  const handleCreateMatch = async (sourceId: string, targetId: string, confidence: number) => {
    if (onCreateMatch) {
      try {
        await onCreateMatch(sourceId, targetId, confidence);
        message.success('Match created successfully');
        setAlternativesModalVisible(false);
        setSelectedTransaction(null);
      } catch (error) {
        message.error('Failed to create match');
      }
    }
  };

  const handleAutoMatchAll = () => {
    const highConfidenceTransactions = filteredAndSorted.filter(
      (ut) => ut.hasHighConfidenceAlternative
    );

    if (highConfidenceTransactions.length === 0) {
      message.info('No high confidence alternatives available');
      return;
    }

    Modal.confirm({
      title: 'Auto-Match High Confidence Alternatives',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to automatically create matches for ${highConfidenceTransactions.length} transaction(s) with high confidence alternatives (>=90%)?`,
      okText: 'Auto-Match All',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        let successCount = 0;
        for (const ut of highConfidenceTransactions) {
          const bestAlternative = ut.alternativeMatches[0]; // First is highest confidence
          try {
            if (onCreateMatch) {
              await onCreateMatch(
                ut.transaction.id,
                bestAlternative.transaction.id,
                bestAlternative.confidence
              );
              successCount++;
            }
          } catch (error) {
            console.error(`Failed to match transaction ${ut.transaction.id}:`, error);
          }
        }
        message.success(`Successfully created ${successCount} matches`);
        if (onRefresh) {
          onRefresh();
        }
      },
    });
  };

  const handleSelect = (transactionId: string, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, transactionId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== transactionId));
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSorted.map((ut) => ut.transaction.id));
    }
  };

  const sortOptions = [
    { label: 'Days Unmatched', value: 'daysUnmatched' },
    { label: 'Date', value: 'date' },
    { label: 'Amount', value: 'amount' },
    { label: 'Alternatives', value: 'alternatives' },
  ];

  return (
    <div>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Unmatched Pool
            </Title>
          </Col>
          <Col>
            <Space>
              {highConfidenceCount > 0 && (
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleAutoMatchAll}
                >
                  Auto-Match All ({highConfidenceCount})
                </Button>
              )}
              {onRefresh && (
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                  Refresh
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Unmatched"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Bank Unmatched"
              value={stats.bankUnmatched}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Ledger Unmatched"
              value={stats.ledgerUnmatched}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="With Alternatives"
              value={stats.withAlternatives}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  / {stats.total}
                </Text>
              }
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Total Unmatched Amount"
              value={stats.totalUnmatchedAmount}
              precision={2}
              prefix="$"
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Average Days Unmatched"
              value={stats.averageDaysUnmatched}
              precision={0}
              suffix="days"
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div>
              <Text type="secondary" style={{ fontSize: 14, display: 'block' }}>
                Urgency Breakdown
              </Text>
              <Space size={4} style={{ marginTop: 8 }} wrap>
                <Tag color="#cf1322">Critical: {urgencyGroups.get('critical')?.length || 0}</Tag>
                <Tag color="#ff4d4f">High: {urgencyGroups.get('high')?.length || 0}</Tag>
                <Tag color="#faad14">Medium: {urgencyGroups.get('medium')?.length || 0}</Tag>
                <Tag color="#52c41a">Low: {urgencyGroups.get('low')?.length || 0}</Tag>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={16}>
        {/* Filters */}
        <Col span={6}>
          <UnmatchedPoolFilters onFilterChange={setFilter} initialFilter={filter} />
        </Col>

        {/* Unmatched List */}
        <Col span={18}>
          <Card
            size="small"
            title={
              <Space>
                <span>Unmatched Transactions</span>
                <Tag color="blue">{filteredAndSorted.length}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Sort by:
                </Text>
                <Select
                  size="small"
                  value={sortField}
                  onChange={setSortField}
                  options={sortOptions}
                  style={{ width: 150 }}
                />
                <Button
                  size="small"
                  icon={<SortAscendingOutlined />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </Space>
            }
          >
            {/* Select All */}
            {filteredAndSorted.length > 0 && (
              <div style={{ marginBottom: 12, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredAndSorted.length}
                    indeterminate={
                      selectedIds.length > 0 && selectedIds.length < filteredAndSorted.length
                    }
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                  <Text>
                    {selectedIds.length > 0
                      ? `${selectedIds.length} selected`
                      : 'Select all'}
                  </Text>
                  {selectedIds.length > 0 && (
                    <Button size="small" onClick={() => setSelectedIds([])}>
                      Clear Selection
                    </Button>
                  )}
                </Space>
              </div>
            )}

            {/* Transaction List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" tip="Loading unmatched transactions..." />
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <Empty
                description={
                  filter && Object.keys(filter).length > 0
                    ? 'No unmatched transactions match your filters'
                    : 'No unmatched transactions found'
                }
              />
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {filteredAndSorted.map((unmatched) => (
                    <UnmatchedTransactionCard
                      key={unmatched.transaction.id}
                      unmatched={unmatched}
                      onViewAlternatives={handleViewAlternatives}
                      onManualMatch={onManualMatch}
                      selected={selectedIds.includes(unmatched.transaction.id)}
                      onSelect={handleSelect}
                      showActions
                    />
                  ))}
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Alternative Matches Modal */}
      {selectedTransaction && (
        <AlternativeMatchesModal
          visible={alternativesModalVisible}
          onClose={() => {
            setAlternativesModalVisible(false);
            setSelectedTransaction(null);
          }}
          sourceTransaction={selectedTransaction.transaction}
          alternatives={selectedTransaction.alternativeMatches}
          onCreateMatch={handleCreateMatch}
        />
      )}
    </div>
  );
};

export default UnmatchedPoolManager;
