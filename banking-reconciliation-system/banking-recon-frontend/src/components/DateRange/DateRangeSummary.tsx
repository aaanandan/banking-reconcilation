/**
 * Date Range Summary Component
 *
 * Displays summary statistics for the selected date range, including:
 * - Transaction counts (total, bank, ledger)
 * - Amount summaries
 * - Coverage percentage
 * - Date range information
 */

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space, Tag } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  BankOutlined,
  BookOutlined,
  DollarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import {
  DateRangeSummary as DateRangeSummaryType,
  formatAmount,
  getCoverageColor,
  DISPLAY_DATE_FORMAT,
} from '../../utils/dateRangeUtils';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface DateRangeSummaryProps {
  summary: DateRangeSummaryType;
  loading?: boolean;
}

export const DateRangeSummary: React.FC<DateRangeSummaryProps> = ({ summary, loading = false }) => {
  const coverageStatus = getCoverageColor(summary.coverage.percentage);

  return (
    <Card loading={loading} className="date-range-summary">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Text strong style={{ fontSize: 16 }}>
            Date Range Summary
          </Text>
          <br />
          <Text type="secondary">
            Overview of transactions within the selected date range
          </Text>
        </div>

        {/* Transaction Counts */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title="Total Transactions"
                value={summary.totalTransactions}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title="Bank Transactions"
                value={summary.bankTransactions}
                prefix={<BankOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title="Ledger Transactions"
                value={summary.ledgerTransactions}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Amount Summaries */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title="Total Amount"
                value={formatAmount(summary.amountSummary.total)}
                prefix={<DollarOutlined />}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title="Bank Amount"
                value={formatAmount(summary.amountSummary.bank)}
                prefix={<DollarOutlined />}
                valueStyle={{ fontSize: 18, color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title="Ledger Amount"
                value={formatAmount(summary.amountSummary.ledger)}
                prefix={<DollarOutlined />}
                valueStyle={{ fontSize: 18, color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Coverage */}
        <Card size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>
                <PercentageOutlined /> Coverage
              </Text>
              <Tag color={coverageStatus}>{summary.coverage.percentage}%</Tag>
            </div>
            <Progress
              percent={summary.coverage.percentage}
              status={coverageStatus === 'error' ? 'exception' : coverageStatus === 'success' ? 'success' : 'normal'}
              showInfo={false}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Included:</Text>{' '}
                <Text strong>{summary.coverage.included.toLocaleString()}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Excluded:</Text>{' '}
                <Text strong>{summary.coverage.excluded.toLocaleString()}</Text>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* Date Range Info */}
        {summary.dateRange.earliest && summary.dateRange.latest && (
          <Card size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>
                <CalendarOutlined /> Available Date Range
              </Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Earliest:</Text>
                  <br />
                  <Text strong>{dayjs(summary.dateRange.earliest).format(DISPLAY_DATE_FORMAT)}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Latest:</Text>
                  <br />
                  <Text strong>{dayjs(summary.dateRange.latest).format(DISPLAY_DATE_FORMAT)}</Text>
                </Col>
              </Row>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};
