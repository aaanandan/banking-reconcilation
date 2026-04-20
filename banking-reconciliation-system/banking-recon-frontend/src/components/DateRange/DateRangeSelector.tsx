/**
 * Date Range Selector Component
 *
 * Main component for date range selection with:
 * - Preset buttons (This Month, Last Month, etc.)
 * - Custom date range picker
 * - Summary statistics
 * - Validation and error handling
 * - Navigation controls
 */

import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Space, Alert, Typography, DatePicker, Tag } from 'antd';
import {
  CalendarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import {
  DateRange,
  DateRangePreset,
  DATE_RANGE_PRESETS,
  FileTransactions,
  getPresetDateRange,
  calculateDateRangeSummary,
  formatDateRange,
  validateDateRange,
  isDateRangeReady,
  getSuggestedPresets,
} from '../../utils/dateRangeUtils';
import { DateRangeSummary } from './DateRangeSummary';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export interface DateRangeSelectorProps {
  files: FileTransactions[];
  onNext?: (range: DateRange) => void;
  onBack?: () => void;
  loading?: boolean;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  files,
  onNext,
  onBack,
  loading = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(DateRangePreset.ALL);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [customDates, setCustomDates] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Get suggested presets based on transaction data
  const suggestedPresets = useMemo(() => getSuggestedPresets(files), [files]);

  // Calculate summary for current date range
  const summary = useMemo(() => calculateDateRangeSummary(files, dateRange), [files, dateRange]);

  // Validate current date range
  const validation = useMemo(() => validateDateRange(dateRange), [dateRange]);

  // Check if ready for next step
  const readyCheck = useMemo(() => isDateRangeReady(dateRange, summary), [dateRange, summary]);

  // Handle preset selection
  const handlePresetSelect = (preset: DateRangePreset) => {
    setSelectedPreset(preset);

    if (preset === DateRangePreset.CUSTOM) {
      // For custom, wait for user to select dates
      setDateRange({ startDate: customDates[0], endDate: customDates[1] });
    } else {
      // Use preset's date range
      const range = getPresetDateRange(preset);
      setDateRange(range);

      // Reset custom dates if not custom preset
      setCustomDates([null, null]);
    }
  };

  // Handle custom date range change
  const handleCustomDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates) {
      setCustomDates([null, null]);
      setDateRange({ startDate: null, endDate: null });
      return;
    }

    setCustomDates(dates);
    setDateRange({ startDate: dates[0], endDate: dates[1] });
    setSelectedPreset(DateRangePreset.CUSTOM);
  };

  // Handle next button click
  const handleNext = () => {
    if (onNext && readyCheck.ready) {
      onNext(dateRange);
    }
  };

  return (
    <div className="date-range-selector">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={3}>
              <CalendarOutlined /> Select Date Range
            </Title>
            <Text type="secondary">
              Choose a date range to filter transactions for reconciliation. This step is optional - you can
              process all transactions by selecting "All Transactions".
            </Text>
          </Space>
        </Card>

        <Row gutter={24}>
          {/* Left Column - Preset Selection */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Preset Buttons */}
              <Card title="Quick Presets" size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {DATE_RANGE_PRESETS.filter((preset) =>
                    suggestedPresets.includes(preset.key) || preset.key === DateRangePreset.CUSTOM
                  ).map((preset) => (
                    <Button
                      key={preset.key}
                      type={selectedPreset === preset.key ? 'primary' : 'default'}
                      block
                      onClick={() => handlePresetSelect(preset.key)}
                      icon={preset.key === DateRangePreset.ALL ? <InfoCircleOutlined /> : <CalendarOutlined />}
                      style={{ textAlign: 'left', height: 'auto', padding: '8px 16px' }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{preset.label}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{preset.description}</div>
                      </div>
                    </Button>
                  ))}
                </Space>
              </Card>

              {/* Custom Date Picker */}
              {selectedPreset === DateRangePreset.CUSTOM && (
                <Card title="Custom Date Range" size="small">
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <RangePicker
                      value={customDates}
                      onChange={handleCustomDateChange}
                      format="MMM DD, YYYY"
                      style={{ width: '100%' }}
                      disabledDate={(current) => current && current.isAfter(dayjs().endOf('day'))}
                      placeholder={['Start Date', 'End Date']}
                    />
                    {customDates[0] && customDates[1] && (
                      <Alert
                        message="Custom Range Selected"
                        description={formatDateRange({ startDate: customDates[0], endDate: customDates[1] })}
                        type="info"
                        showIcon
                      />
                    )}
                  </Space>
                </Card>
              )}

              {/* Selected Range Info */}
              <Card size="small">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>Selected Range:</Text>
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                    {formatDateRange(dateRange)}
                  </Tag>
                  {validation.error && (
                    <Alert message={validation.error} type="error" showIcon closable={false} />
                  )}
                </Space>
              </Card>
            </Space>
          </Col>

          {/* Right Column - Summary */}
          <Col xs={24} lg={14}>
            <DateRangeSummary summary={summary} loading={loading} />
          </Col>
        </Row>

        {/* Validation & Ready State */}
        {!readyCheck.ready && readyCheck.message && (
          <Alert
            message="Cannot Proceed"
            description={readyCheck.message}
            type="warning"
            showIcon
            closable={false}
          />
        )}

        {readyCheck.ready && summary.coverage.percentage < 100 && (
          <Alert
            message="Partial Coverage"
            description={`You are processing ${summary.coverage.percentage}% of total transactions (${summary.coverage.excluded.toLocaleString()} transactions excluded). Consider adjusting the date range to include more data.`}
            type="info"
            showIcon
            closable
          />
        )}

        {/* Navigation Buttons */}
        <Card>
          <Row justify="space-between">
            <Col>
              <Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={loading}>
                Back: Column Mapping
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
                disabled={!readyCheck.ready || loading}
                loading={loading}
                size="large"
              >
                Next: Start Processing
              </Button>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};
