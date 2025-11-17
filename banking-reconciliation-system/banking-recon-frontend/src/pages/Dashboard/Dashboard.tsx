import React from 'react';
import { Row, Col, Card, Statistic, Table, Progress, Button, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface ReconciliationRecord {
  key: string;
  id: string;
  date: string;
  status: string;
  matchedPercent: number;
}

interface TrendData {
  month: string;
  accuracy: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for statistics
  const statistics = {
    totalReconciliations: 156,
    matchedTransactions: 12450,
    pendingQuestions: 23,
    successRate: 94.5,
  };

  // Mock data for recent reconciliations
  const recentReconciliations: ReconciliationRecord[] = [
    {
      key: '1',
      id: 'RECON-2025-001',
      date: '2025-01-15',
      status: 'Completed',
      matchedPercent: 98,
    },
    {
      key: '2',
      id: 'RECON-2025-002',
      date: '2025-01-14',
      status: 'In Progress',
      matchedPercent: 75,
    },
    {
      key: '3',
      id: 'RECON-2025-003',
      date: '2025-01-13',
      status: 'Completed',
      matchedPercent: 95,
    },
    {
      key: '4',
      id: 'RECON-2025-004',
      date: '2025-01-12',
      status: 'Pending Review',
      matchedPercent: 88,
    },
    {
      key: '5',
      id: 'RECON-2025-005',
      date: '2025-01-11',
      status: 'Completed',
      matchedPercent: 100,
    },
  ];

  // Mock data for usage quotas
  const quotas = {
    transactions: { used: 8420, limit: 10000 },
    bankAccounts: { used: 5, limit: 10 },
    storage: { used: 2.3, limit: 5.0 },
  };

  // Mock data for convergence trend
  const trendData: TrendData[] = [
    { month: 'Jul', accuracy: 88 },
    { month: 'Aug', accuracy: 90 },
    { month: 'Sep', accuracy: 92 },
    { month: 'Oct', accuracy: 91 },
    { month: 'Nov', accuracy: 93 },
    { month: 'Dec', accuracy: 94 },
    { month: 'Jan', accuracy: 95 },
  ];

  const columns: ColumnsType<ReconciliationRecord> = [
    {
      title: 'Reconciliation ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Completed', value: 'Completed' },
        { text: 'In Progress', value: 'In Progress' },
        { text: 'Pending Review', value: 'Pending Review' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Matched %',
      dataIndex: 'matchedPercent',
      key: 'matchedPercent',
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          status={percent === 100 ? 'success' : percent > 90 ? 'normal' : 'exception'}
        />
      ),
      sorter: (a, b) => a.matchedPercent - b.matchedPercent,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button type="link" size="small">
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Dashboard</Title>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Reconciliations"
              value={statistics.totalReconciliations}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Matched Transactions"
              value={statistics.matchedTransactions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Questions"
              value={statistics.pendingQuestions}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={statistics.successRate}
              prefix={<TrophyOutlined />}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 24 }} title="Quick Actions">
        <Space size="middle">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/reconciliation/new')}
          >
            New Reconciliation
          </Button>
          <Button
            size="large"
            icon={<BarChartOutlined />}
            onClick={() => navigate('/reports')}
          >
            View Reports
          </Button>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* Recent Reconciliations Table */}
        <Col xs={24} lg={16}>
          <Card title="Recent Reconciliations">
            <Table
              columns={columns}
              dataSource={recentReconciliations}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>

        {/* Usage Quotas */}
        <Col xs={24} lg={8}>
          <Card title="Usage Quotas" style={{ height: '100%' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8 }}>
                <span>Transactions</span>
                <span style={{ float: 'right' }}>
                  {quotas.transactions.used.toLocaleString()} / {quotas.transactions.limit.toLocaleString()}
                </span>
              </div>
              <Progress
                percent={(quotas.transactions.used / quotas.transactions.limit) * 100}
                status="active"
                showInfo={false}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8 }}>
                <span>Bank Accounts</span>
                <span style={{ float: 'right' }}>
                  {quotas.bankAccounts.used} / {quotas.bankAccounts.limit}
                </span>
              </div>
              <Progress
                percent={(quotas.bankAccounts.used / quotas.bankAccounts.limit) * 100}
                status="active"
                showInfo={false}
              />
            </div>

            <div>
              <div style={{ marginBottom: 8 }}>
                <span>Storage (GB)</span>
                <span style={{ float: 'right' }}>
                  {quotas.storage.used} / {quotas.storage.limit}
                </span>
              </div>
              <Progress
                percent={(quotas.storage.used / quotas.storage.limit) * 100}
                status="active"
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Convergence Trend Chart */}
      <Card title="Matching Accuracy Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[80, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#1890ff"
              strokeWidth={2}
              name="Accuracy (%)"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Dashboard;
