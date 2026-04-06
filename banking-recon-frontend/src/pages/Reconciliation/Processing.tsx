import { useEffect, useState } from 'react';
import { Card, Progress, Typography, Steps, Timeline, Spin, Result, Button } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const { Title, Text } = Typography;

const PROCESSING_STEPS = [
  'Data normalization',
  'MT-01: Exact Match',
  'MT-02: Near-Exact Match',
  'MT-03: Bank Fees',
  'MT-04: Interest Calculations',
  'MT-05: Split Payments',
  'MT-06: Consolidated Deposits',
  'MT-07: Duplicate Detection',
  'MT-08: Reversals',
  'MT-09: Timing Differences',
  'MT-10: Currency Conversion',
  'MT-11: Rounding Adjustments',
  'MT-12: High-Volume Payer',
  'MT-13: Standing Orders',
  'MT-14: Unmatched Pool',
  'MT-15: Manual Classification',
  'MT-16: Final Validation',
  'Learning system update',
];

export const Processing: React.FC = () => {
  const navigate = useNavigate();
  const { reconciliationId } = useSelector((state: RootState) => state.reconciliation);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Simulate processing steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= PROCESSING_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => setDone(true), 500);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.round((currentStep / PROCESSING_STEPS.length) * 100);

  if (done) {
    return (
      <Result
        status="success"
        title="Reconciliation Complete"
        subTitle={`Reconciliation ${reconciliationId || '#001'} completed successfully`}
        extra={[
          <Button type="primary" key="review" onClick={() => navigate('/reconciliation/1/review')}>
            View Results
          </Button>,
          <Button key="dashboard" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>,
        ]}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Processing Reconciliation
        </Title>
        <Text type="secondary">Running 16 matching algorithms on your data</Text>
      </div>

      <Steps
        current={3}
        items={[
          { title: 'Upload Files', status: 'finish' },
          { title: 'Map Columns', status: 'finish' },
          { title: 'Date Range', status: 'finish' },
          { title: 'Processing', status: 'process' },
          { title: 'Review' },
        ]}
        style={{ marginBottom: 32 }}
      />

      <Card style={{ marginBottom: 24, textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />
        <div style={{ marginTop: 24 }}>
          <Progress
            percent={progress}
            status="active"
            strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
            style={{ maxWidth: 600, margin: '0 auto' }}
          />
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            {currentStep < PROCESSING_STEPS.length
              ? PROCESSING_STEPS[currentStep]
              : 'Finalizing...'}
          </Text>
        </div>
      </Card>

      <Card title="Processing Steps">
        <Timeline
          items={PROCESSING_STEPS.map((step, i) => ({
            color: i < currentStep ? 'green' : i === currentStep ? 'blue' : 'gray',
            dot:
              i < currentStep ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : i === currentStep ? (
                <LoadingOutlined style={{ color: '#1890ff' }} />
              ) : (
                <ClockCircleOutlined />
              ),
            children: (
              <Text
                style={{
                  color: i < currentStep ? '#52c41a' : i === currentStep ? '#1890ff' : '#999',
                  fontWeight: i === currentStep ? 600 : 400,
                }}
              >
                {step}
              </Text>
            ),
          }))}
        />
      </Card>
    </div>
  );
};
