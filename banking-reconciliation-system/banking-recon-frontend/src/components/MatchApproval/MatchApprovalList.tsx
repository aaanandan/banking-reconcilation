import React from 'react';
import { Empty, Spin, Space, Checkbox, Button, Divider } from 'antd';
import { MatchedPair } from '../../utils/matchApprovalUtils';
import { MatchedPairCard } from './MatchedPairCard';

interface MatchApprovalListProps {
  pairs: MatchedPair[];
  loading?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onApprove?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onViewDetails?: (matchId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * List of matched pairs for approval
 */
export const MatchApprovalList: React.FC<MatchApprovalListProps> = ({
  pairs,
  loading = false,
  selectedIds = [],
  onSelectionChange,
  onApprove,
  onReject,
  onViewDetails,
  showActions = true,
  compact = false,
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      // Select all pending matches
      const pendingIds = pairs
        .filter((p) => p.match.status === 'pending')
        .map((p) => p.match.id);
      onSelectionChange(pendingIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelect = (matchId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedIds, matchId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== matchId));
    }
  };

  const pendingPairs = pairs.filter((p) => p.match.status === 'pending');
  const allPendingSelected =
    pendingPairs.length > 0 &&
    pendingPairs.every((p) => selectedIds.includes(p.match.id));
  const somePendingSelected =
    pendingPairs.some((p) => selectedIds.includes(p.match.id)) &&
    !allPendingSelected;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <Empty
        description="No matched pairs found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {/* Select All */}
      {onSelectionChange && pendingPairs.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Checkbox
                checked={allPendingSelected}
                indeterminate={somePendingSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                Select All Pending ({pendingPairs.length})
              </Checkbox>
              {selectedIds.length > 0 && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => onSelectionChange([])}
                >
                  Clear Selection
                </Button>
              )}
            </Space>
          </div>
          <Divider style={{ margin: '12px 0' }} />
        </>
      )}

      {/* List of Matched Pairs */}
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {pairs.map((pair) => (
          <MatchedPairCard
            key={pair.match.id}
            pair={pair}
            selected={selectedIds.includes(pair.match.id)}
            onSelect={handleSelect}
            onApprove={onApprove}
            onReject={onReject}
            onViewDetails={onViewDetails}
            showActions={showActions}
            compact={compact}
          />
        ))}
      </Space>
    </div>
  );
};

export default MatchApprovalList;
