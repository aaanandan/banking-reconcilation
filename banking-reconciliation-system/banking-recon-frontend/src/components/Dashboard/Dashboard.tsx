import React from 'react';
import { Row, Col, Card, Typography, Progress, Tag, List, Space, Button } from 'antd';
import {
  DashboardOutlined,
  ReconciliationOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { StatCard } from './StatCard';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import {
  DashboardMetrics,
  RecentReconciliation,
  ActivityItem,
  getReconciliationStatusLabel,
  getReconciliationStatusColor,
  calculateCompletionPercentage,
  formatRelativeTime,
  getUnmatchedUrgencyLevel,
  getUrgencyColor,
} from '../../utils/dashboardUtils';

const { Title, Text } = Typography;

interface DashboardProps {
  metrics: DashboardMetrics;
  recentReconciliations: RecentReconciliation[];
  activities: ActivityItem[];
  loading?: boolean;
  onNavigate: (route: string) => void;
  onViewReconciliation?: (reconciliationId: string) => void;
}

/**
 * Main dashboard component
 */
export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  recentReconciliations,
  activities,
  loading = false,
  onNavigate,
  onViewReconciliation,
}) => {
  const unmatchedUrgency = getUnmatchedUrgencyLevel(metrics.unmatched.total);

  return (
    <div>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          Dashboard
        </Title>
      </Card>

      {/* Key Metrics Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <StatCard
            title="Reconciliations This Month"
            value={metrics.reconciliations.thisMonth}
            prefix={<ReconciliationOutlined />}
            color="#1890ff"
            trend={metrics.reconciliations.trend}
            trendPercentage={metrics.reconciliations.trendPercentage}
            trendLabel="vs last month"
            onClick={() => onNavigate('/reconciliations')}
          />
        </Col>
        <Col span={6}>
          <StatCard
            title="Automation Rate"
            value={metrics.matches.automationRate}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
            onClick={() => onNavigate('/matches')}
          />
        </Col>
        <Col span={6}>
          <StatCard
            title="Unmatched Transactions"
            value={metrics.unmatched.total}
            prefix={<ExclamationCircleOutlined />}
            color={getUrgencyColor(unmatchedUrgency)}
            onClick={() => onNavigate('/unmatched')}
          />
        </Col>
        <Col span={6}>
          <StatCard
            title="Active Users"
            value={metrics.users.active}
            suffix={`/ ${metrics.users.total}`}
            prefix={<TeamOutlined />}
            color="#722ed1"
            onClick={() => onNavigate('/users')}
          />
        </Col>
      </Row>

      {/* Secondary Metrics Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Unmatched Breakdown
              </Text>
              <Space size={4} wrap>
                {metrics.unmatched.critical > 0 && (
                  <Tag color="error">Critical: {metrics.unmatched.critical}</Tag>
                )}
                {metrics.unmatched.high > 0 && (
                  <Tag color="warning">High: {metrics.unmatched.high}</Tag>
                )}
                {metrics.unmatched.medium > 0 && (
                  <Tag color="default">Medium: {metrics.unmatched.medium}</Tag>
                )}
                {metrics.unmatched.low > 0 && (
                  <Tag>Low: {metrics.unmatched.low}</Tag>
                )}
              </Space>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Match Distribution
              </Text>
              <Text strong style={{ fontSize: 16 }}>
                {metrics.matches.automated} auto / {metrics.matches.manual} manual
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Total: {metrics.matches.total} matches
              </Text>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Learned Entities
              </Text>
              <Text strong style={{ fontSize: 16 }}>
                {metrics.entities.learned} / {metrics.entities.total}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {metrics.entities.pendingQuestions} questions pending
              </Text>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                User Status
              </Text>
              <Space size={4} wrap>
                <Tag color="success">Active: {metrics.users.active}</Tag>
                {metrics.users.pending > 0 && (
                  <Tag color="warning">Pending: {metrics.users.pending}</Tag>
                )}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <QuickActions onActionClick={onNavigate} />
        </Col>
      </Row>

      {/* Recent Reconciliations & Activity */}
      <Row gutter={16}>
        <Col span={14}>
          <Card
            title={
              <Space>
                <ReconciliationOutlined />
                <span>Recent Reconciliations</span>
              </Space>
            }
            size="small"
            extra={
              <Button
                type="link"
                size="small"
                icon={<RightOutlined />}
                onClick={() => onNavigate('/reconciliations')}
              >
                View All
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={recentReconciliations.slice(0, 5)}
              renderItem={(recon) => {
                const completionPercentage = calculateCompletionPercentage(
                  recon.matchedTransactions,
                  recon.totalTransactions
                );

                return (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => onViewReconciliation?.(recon.id)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{recon.name}</Text>
                          <Tag color={getReconciliationStatusColor(recon.status)}>
                            {getReconciliationStatusLabel(recon.status)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {recon.matchedTransactions} / {recon.totalTransactions} matched
                            {recon.unmatchedTransactions > 0 &&
                              ` • ${recon.unmatchedTransactions} unmatched`}
                          </Text>
                          {recon.status === 'processing' && (
                            <Progress
                              percent={recon.progress}
                              size="small"
                              status="active"
                            />
                          )}
                          {recon.status === 'review' && (
                            <Progress
                              percent={completionPercentage}
                              size="small"
                              strokeColor="#faad14"
                            />
                          )}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Created {formatRelativeTime(recon.createdAt)} by {recon.createdBy}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col span={10}>
          <RecentActivity activities={activities} loading={loading} maxItems={8} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
