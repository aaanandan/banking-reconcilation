import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Space, Button, Modal, message, Drawer, Statistic, Divider } from 'antd';
import {
  LinkOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Transaction } from '../../types/transaction';
import {
  MatchCandidate,
  MatchingRules,
  DEFAULT_MATCHING_RULES,
  findMatchingCandidates,
  calculateOverallScore,
} from '../../utils/matchingAlgorithms';
import { MatchingCandidatesList } from './MatchingCandidatesList';
import { MatchingComparison } from './MatchingComparison';
import { MatchingRulesPanel } from './MatchingRulesPanel';
import { TransactionDetails } from '../Transactions/TransactionDetails';

interface TransactionMatchingManagerProps {
  sourceTransaction: Transaction;
  potentialMatches: Transaction[];
  onCreateMatch: (sourceId: string, targetId: string, confidence: number) => void;
  onCancel?: () => void;
  initialRules?: MatchingRules;
}

/**
 * Transaction Matching Manager
 * Main component for finding and creating transaction matches
 */
export const TransactionMatchingManager: React.FC<TransactionMatchingManagerProps> = ({
  sourceTransaction,
  potentialMatches,
  onCreateMatch,
  onCancel,
  initialRules = DEFAULT_MATCHING_RULES,
}) => {
  const [rules, setRules] = useState<MatchingRules>(initialRules);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Find matching candidates
  const candidates = useMemo(() => {
    return findMatchingCandidates(sourceTransaction, potentialMatches, rules);
  }, [sourceTransaction, potentialMatches, rules]);

  // Handle match creation
  const handleCreateMatch = useCallback(
    (candidate: MatchCandidate) => {
      Modal.confirm({
        title: 'Create Match',
        content: (
          <div>
            <p>
              Are you sure you want to match these transactions with{' '}
              <strong>{Math.round(candidate.score)}% confidence</strong>?
            </p>
            <p>
              <strong>Source:</strong> {sourceTransaction.description}
            </p>
            <p>
              <strong>Target:</strong> {candidate.transaction.description}
            </p>
          </div>
        ),
        okText: 'Create Match',
        cancelText: 'Cancel',
        onOk: () => {
          onCreateMatch(
            sourceTransaction.id,
            candidate.transaction.id,
            candidate.score
          );
          message.success('Match created successfully');
        },
      });
    },
    [sourceTransaction, onCreateMatch]
  );

  // Handle auto-match (high confidence)
  const handleAutoMatch = useCallback(() => {
    if (candidates.length === 0) {
      message.warning('No candidates available');
      return;
    }

    const best = candidates[0];
    if (best.score < 90) {
      message.warning('No high-confidence match found (>90%)');
      return;
    }

    handleCreateMatch(best);
  }, [candidates, handleCreateMatch]);

  // Handle candidate selection
  const handleSelectCandidate = useCallback((candidate: MatchCandidate) => {
    setSelectedCandidate(candidate);
    setShowComparison(true);
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card size="small">
          <Row justify="space-between" align="middle">
            <Col>
              <h2 style={{ margin: 0 }}>Find Match</h2>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                Finding matches for: {sourceTransaction.description}
              </span>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowRules(!showRules)}
                >
                  {showRules ? 'Hide' : 'Show'} Rules
                </Button>
                {candidates.length > 0 && candidates[0].score >= 90 && (
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleAutoMatch}
                  >
                    Auto Match ({Math.round(candidates[0].score)}%)
                  </Button>
                )}
                {onCancel && (
                  <Button icon={<CloseOutlined />} onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Card size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Candidates"
                value={candidates.length}
                suffix={`/ ${potentialMatches.length}`}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="High Confidence"
                value={candidates.filter((c) => c.score >= 90).length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Good Match"
                value={candidates.filter((c) => c.score >= 75 && c.score < 90).length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Low Confidence"
                value={candidates.filter((c) => c.score < 75).length}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          {/* Left: Source Transaction */}
          <Col xs={24} lg={showRules ? 6 : 8}>
            <Card title="Source Transaction" size="small">
              <TransactionDetails
                transaction={sourceTransaction}
                showActions={false}
              />
            </Card>
          </Col>

          {/* Middle: Matching Candidates */}
          <Col xs={24} lg={showRules ? 12 : 16}>
            <Card
              title={`Matching Candidates (${candidates.length})`}
              size="small"
            >
              <MatchingCandidatesList
                candidates={candidates}
                selectedCandidateId={selectedCandidate?.transaction.id}
                onSelectCandidate={handleSelectCandidate}
                onMatchCandidate={handleCreateMatch}
              />
            </Card>
          </Col>

          {/* Right: Rules (collapsible) */}
          {showRules && (
            <Col xs={24} lg={6}>
              <MatchingRulesPanel
                rules={rules}
                onRulesChange={setRules}
                onReset={() => {
                  setRules(DEFAULT_MATCHING_RULES);
                  message.info('Rules reset to defaults');
                }}
              />
            </Col>
          )}
        </Row>
      </Space>

      {/* Comparison Drawer */}
      <Drawer
        title="Match Comparison"
        placement="right"
        width={800}
        open={showComparison}
        onClose={() => setShowComparison(false)}
        extra={
          selectedCandidate && (
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => {
                handleCreateMatch(selectedCandidate);
                setShowComparison(false);
              }}
            >
              Create Match
            </Button>
          )
        }
      >
        {selectedCandidate && (
          <MatchingComparison
            sourceTransaction={sourceTransaction}
            targetTransaction={selectedCandidate.transaction}
            fieldScores={selectedCandidate.fieldScores}
            overallScore={selectedCandidate.score}
          />
        )}
      </Drawer>
    </div>
  );
};

export default TransactionMatchingManager;
