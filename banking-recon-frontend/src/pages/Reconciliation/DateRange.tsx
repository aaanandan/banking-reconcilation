import { useState } from 'react';
import { Card, Button, Typography, Steps, DatePicker, Space, Alert, Radio, Descriptions } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { setDateRange } from '../../store/slices/reconciliation.slice';
import type { RootState, AppDispatch } from '../../store';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const DateRange: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { analysisResult } = useSelector((state: RootState) => state.reconciliation);
  const [useFilter, setUseFilter] = useState(false);
  const [dateRange, setLocalDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);

  if (!analysisResult) {
    navigate('/reconciliation/new');
    return null;
  }

  const recommended = analysisResult.dateRangeAnalysis.recommended;

  const handleContinue = async () => {
    if (useFilter && (!dateRange[0] || !dateRange[1])) return;
    dispatch(
      setDateRange(
        useFilter && dateRange[0] && dateRange[1]
          ? {
              startDate: dateRange[0].format('YYYY-MM-DD'),
              endDate: dateRange[1].format('YYYY-MM-DD'),
            }
          : null
      )
    );
    navigate('/reconciliation/processing');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Date Range Selection
        </Title>
        <Text type="secondary">
          Optionally filter transactions to a specific date range
        </Text>
      </div>

      <Steps
        current={2}
        items={[
          { title: 'Upload Files', status: 'finish' },
          { title: 'Map Columns', status: 'finish' },
          { title: 'Date Range', status: 'process' },
          { title: 'Processing' },
          { title: 'Review' },
        ]}
        style={{ marginBottom: 32 }}
      />

      <Card style={{ marginBottom: 24 }}>
        <Descriptions title="Detected Date Ranges" bordered column={2}>
          {analysisResult.banks.map((bank) => (
            <Descriptions.Item key={bank.bankId} label={bank.bankName}>
              {bank.dateRange.earliest} → {bank.dateRange.latest} ({bank.totalRecords} records)
            </Descriptions.Item>
          ))}
          <Descriptions.Item label="Ledger">
            {analysisResult.ledger.dateRange.earliest} → {analysisResult.ledger.dateRange.latest} (
            {analysisResult.ledger.totalRecords} records)
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<Space><CalendarOutlined /> Date Filter</Space>}>
        <Radio.Group
          value={useFilter}
          onChange={(e) => setUseFilter(e.target.value)}
          style={{ marginBottom: 24 }}
        >
          <Space direction="vertical">
            <Radio value={false}>
              <Text strong>Process all transactions</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Recommended: {recommended.startDate} to {recommended.endDate}
              </Text>
            </Radio>
            <Radio value={true}>
              <Text strong>Filter by date range</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Only process transactions within a specific period
              </Text>
            </Radio>
          </Space>
        </Radio.Group>

        {useFilter && (
          <>
            <Alert
              message="Filtering reduces the number of transactions processed, which can speed up reconciliation."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <RangePicker
              onChange={(dates) =>
                setLocalDateRange([dates?.[0] || null, dates?.[1] || null])
              }
              style={{ width: '100%' }}
              size="large"
              format="YYYY-MM-DD"
            />
          </>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reconciliation/mapping')} size="large">
          Back
        </Button>
        <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleContinue} size="large">
          Start Processing
        </Button>
      </div>
    </div>
  );
};
