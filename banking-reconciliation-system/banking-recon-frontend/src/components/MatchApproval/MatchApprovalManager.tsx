import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Space, Button, Statistic, Modal, message, Input, Drawer } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { MatchedPair, MatchApprovalFilter, calculateMatchApprovalStats, filterMatchedPairs, sortMatchedPairs } from '../../utils/matchApprovalUtils';
import { MatchApprovalFilters } from './MatchApprovalFilters';
import { MatchApprovalList } from './MatchApprovalList';
import { MatchingComparison } from '../Matching/MatchingComparison';
import { calculateOverallScore } from '../../utils/matchingAlgorithms';

const { TextArea } = Input;

interface MatchApprovalManagerProps {
  pairs: MatchedPair[];
  loading?: boolean;
  onRefresh?: () => void;
  onApprove?: (matchId: string) => void;
  onReject?: (matchId: string, reason: string) => void;
  onBulkApprove?: (matchIds: string[]) => void;
  onBulkReject?: (matchIds: string[], reason: string) => void;
}

/**
 * Match Approval Manager
 * Main component for reviewing and approving/rejecting matched transactions
 */
export const MatchApprovalManager: React.FC<MatchApprovalManagerProps> = ({
  pairs,
  loading = false,
  onRefresh,
  onApprove,
  onReject,
  onBulkApprove,
  onBulkReject,
}) => {
  const [filter, setFilter] = useState<MatchApprovalFilter>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingMatchId, setRejectingMatchId] = useState<string | null>(null);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [showComparisonDrawer, setShowComparisonDrawer] = useState(false);
  const [selectedPair, setSelectedPair] = useState<MatchedPair | null>(null);

  // Filter and sort pairs
  const filteredPairs = useMemo(() => {
    let result = filterMatchedPairs(pairs, filter);
    // Sort by confidence descending by default
    result = sortMatchedPairs(result, 'confidence', 'desc');
    return result;
  }, [pairs, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateMatchApprovalStats(pairs.map((p) => p.match));
  }, [pairs]);

  // Get unique users for filter
  const matchedByOptions = useMemo(() => {
    const users = new Set(pairs.map((p) => p.match.matchedBy));
    return Array.from(users);
  }, [pairs]);

  // Handlers
  const handleApprove = useCallback(
    (matchId: string) => {
      Modal.confirm({
        title: 'Approve Match',
        content: 'Are you sure you want to approve this match?',
        okText: 'Approve',
        cancelText: 'Cancel',
        onOk: () => {
          if (onApprove) {
            onApprove(matchId);
            message.success('Match approved');
          }
        },
      });
    },
    [onApprove]
  );

  const handleReject = useCallback((matchId: string) => {
    setRejectingMatchId(matchId);
    setRejectReason('');
    setShowRejectModal(true);
  }, []);

  const handleRejectConfirm = useCallback(() => {
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection');
      return;
    }

    if (rejectingMatchId && onReject) {
      onReject(rejectingMatchId, rejectReason);
      setShowRejectModal(false);
      setRejectingMatchId(null);
      setRejectReason('');
      message.success('Match rejected');
    }
  }, [rejectingMatchId, rejectReason, onReject]);

  const handleBulkApprove = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('Please select matches to approve');
      return;
    }

    Modal.confirm({
      title: 'Bulk Approve Matches',
      content: `Are you sure you want to approve ${selectedIds.length} match(es)?`,
      okText: 'Approve All',
      cancelText: 'Cancel',
      onOk: () => {
        if (onBulkApprove) {
          onBulkApprove(selectedIds);
          setSelectedIds([]);
          message.success(`${selectedIds.length} match(es) approved`);
        }
      },
    });
  }, [selectedIds, onBulkApprove]);

  const handleBulkReject = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('Please select matches to reject');
      return;
    }

    setRejectReason('');
    setShowBulkRejectModal(true);
  }, [selectedIds]);

  const handleBulkRejectConfirm = useCallback(() => {
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection');
      return;
    }

    if (onBulkReject) {
      onBulkReject(selectedIds, rejectReason);
      setShowBulkRejectModal(false);
      setSelectedIds([]);
      setRejectReason('');
      message.success(`${selectedIds.length} match(es) rejected`);
    }
  }, [selectedIds, rejectReason, onBulkReject]);

  const handleAutoApproveHigh = useCallback(() => {
    const highConfidencePending = pairs.filter(
      (p) => p.match.matchConfidence >= 90 && p.match.status === 'pending'
    );

    if (highConfidencePending.length === 0) {
      message.info('No high-confidence pending matches to auto-approve');
      return;
    }

    Modal.confirm({
      title: 'Auto-Approve High Confidence Matches',
      content: `Auto-approve ${highConfidencePending.length} match(es) with 90%+ confidence?`,
      okText: 'Auto-Approve',
      cancelText: 'Cancel',
      icon: <ThunderboltOutlined />,
      onOk: () => {
        const matchIds = highConfidencePending.map((p) => p.match.id);
        if (onBulkApprove) {
          onBulkApprove(matchIds);
          message.success(`${matchIds.length} match(es) auto-approved`);
        }
      },
    });
  }, [pairs, onBulkApprove]);

  const handleViewDetails = useCallback((matchId: string) => {
    const pair = pairs.find((p) => p.match.id === matchId);
    if (pair) {
      setSelectedPair(pair);
      setShowComparisonDrawer(true);
    }
  }, [pairs]);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card size="small">
          <Row justify="space-between" align="middle">
            <Col>
              <h2 style={{ margin: 0 }}>Match Approval</h2>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                Review and approve matched transactions
              </span>
            </Col>
            <Col>
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
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleAutoApproveHigh}
                  disabled={loading}
                >
                  Auto-Approve High Confidence
                </Button>
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
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Card size="small">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Matches"
                value={stats.total}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Pending"
                value={stats.pending}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Approved"
                value={stats.approved}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Approval Rate"
                value={stats.approvalRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color: stats.approvalRate >= 80 ? '#52c41a' : '#faad14',
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="High Confidence"
                value={stats.highConfidence}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Medium Confidence"
                value={stats.mediumConfidence}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Low Confidence"
                value={stats.lowConfidence}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Auto-Matched"
                value={stats.automatic}
              />
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          {/* Filters */}
          <Col xs={24} lg={6}>
            <MatchApprovalFilters
              onFilterChange={setFilter}
              initialFilter={filter}
              matchedByOptions={matchedByOptions}
            />
          </Col>

          {/* Match List */}
          <Col xs={24} lg={18}>
            <Card
              title={`Matches (${filteredPairs.length})`}
              size="small"
            >
              <MatchApprovalList
                pairs={filteredPairs}
                loading={loading}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={handleViewDetails}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      {/* Reject Modal */}
      <Modal
        title="Reject Match"
        open={showRejectModal}
        onOk={handleRejectConfirm}
        onCancel={() => setShowRejectModal(false)}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>Please provide a reason for rejecting this match:</p>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
        </Space>
      </Modal>

      {/* Bulk Reject Modal */}
      <Modal
        title={`Reject ${selectedIds.length} Matches`}
        open={showBulkRejectModal}
        onOk={handleBulkRejectConfirm}
        onCancel={() => setShowBulkRejectModal(false)}
        okText="Reject All"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            Please provide a reason for rejecting {selectedIds.length} match(es):
          </p>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
        </Space>
      </Modal>

      {/* Comparison Drawer */}
      <Drawer
        title="Match Details"
        placement="right"
        width={800}
        open={showComparisonDrawer}
        onClose={() => setShowComparisonDrawer(false)}
        extra={
          selectedPair && selectedPair.match.status === 'pending' && (
            <Space>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  handleReject(selectedPair.match.id);
                  setShowComparisonDrawer(false);
                }}
              >
                Reject
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  handleApprove(selectedPair.match.id);
                  setShowComparisonDrawer(false);
                }}
              >
                Approve
              </Button>
            </Space>
          )
        }
      >
        {selectedPair && (
          <MatchingComparison
            sourceTransaction={selectedPair.bankTransaction}
            targetTransaction={selectedPair.ledgerTransaction}
            fieldScores={{
              amount: 100, // These would come from match.matchedFields analysis
              date: 100,
              description: 100,
              reference: 50,
            }}
            overallScore={selectedPair.match.matchConfidence}
          />
        )}
      </Drawer>
    </div>
  );
};

export default MatchApprovalManager;
