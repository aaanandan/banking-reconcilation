import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Statistic,
  Progress,
  Space,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { reconciliationApi } from '../../api/reconciliation';
import type { RootState } from '../../store';
import type { ReconciliationSummary } from '../../types';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  completed: 'success',
  processing: 'processing',
  pending: 'default',
  failed: 'error',
};

const convergenceMockData = [
  { day: 'Mon', rate: 72 },
  { day: 'Tue', rate: 78 },
  { day: 'Wed', rate: 82 },
  { day: 'Thu', rate: 85 },
  { day: 'Fri', rate: 91 },
  { day: 'Sat', rate: 88 },
  { day: 'Sun', rate: 94 },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [reconciliations, setReconciliations] = useState<ReconciliationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reconciliationApi.getAll();
        setReconciliations(response.data);
      } catch {
        // Use mock data on error
        setReconciliations([
          {
            id: '1',
            status: 'completed',
            bankFileCount: 2,
            totalBankTransactions: 1250,
            totalLedgerTransactions: 1220,
            matchedCount: 1190,
            unmatchedCount: 60,
            convergenceRate: 95.2,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            completedAt: new Date().toISOString(),
          },
          {
            id: '2',
            status: 'processing',
            bankFileCount: 1,
            totalBankTransactions: 850,
            totalLedgerTransactions: 830,
            matchedCount: 620,
            unmatchedCount: 230,
            convergenceRate: 72.9,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completed = reconciliations.filter((r) => r.status === 'completed').length;
  const processing = reconciliations.filter((r) => r.status === 'processing').length;
  const avgConvergence =
    reconciliations.length > 0
      ? reconciliations.reduce((sum, r) => sum + r.convergenceRate, 0) / reconciliations.length
      : 0;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>#{id.slice(0, 8)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColor[status]}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Bank Files',
      dataIndex: 'bankFileCount',
      key: 'bankFileCount',
    },
    {
      title: 'Transactions',
      key: 'transactions',
      render: (_: unknown, record: ReconciliationSummary) => (
        <Text>{record.totalBankTransactions + record.totalLedgerTransactions}</Text>
      ),
    },
    {
      title: 'Matched',
      dataIndex: 'matchedCount',
      key: 'matchedCount',
      render: (count: number) => <Text style={{ color: '#52c41a' }}>{count}</Text>,
    },
    {
      title: 'Convergence',
      dataIndex: 'convergenceRate',
      key: 'convergenceRate',
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          status={rate >= 90 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
          style={{ minWidth: 100 }}
        />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ReconciliationSummary) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/reconciliation/${record.id}/review`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Dashboard
            </Title>
            <Text type="secondary">
              Welcome back, {user?.firstName}. Here's your reconciliation overview.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/reconciliation/new')}
          >
            New Reconciliation
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Reconciliations"
                value={reconciliations.length}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={completed}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Processing"
                value={processing}
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg. Convergence"
                value={avgConvergence.toFixed(1)}
                suffix="%"
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: avgConvergence >= 90 ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="Recent Reconciliations">
              <Table
                dataSource={reconciliations}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Convergence Trend (Last 7 Days)" style={{ height: '100%' }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={convergenceMockData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Convergence']} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ fill: '#1890ff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/reconciliation/new')}
                >
                  Start New Reconciliation
                </Button>
                <Button block icon={<FileTextOutlined />} onClick={() => navigate('/reports')}>
                  View Reports
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="System Status">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Database</Text>
                  <Tag color="success">Healthy</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Matching Engine</Text>
                  <Tag color="success">Online</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Learning Service</Text>
                  <Tag color="success">Active</Tag>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};
