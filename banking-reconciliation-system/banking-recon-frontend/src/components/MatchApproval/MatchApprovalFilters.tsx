import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { MatchApprovalFilter } from '../../utils/matchApprovalUtils';

const { RangePicker } = DatePicker;

interface MatchApprovalFiltersProps {
  onFilterChange: (filter: MatchApprovalFilter) => void;
  initialFilter?: MatchApprovalFilter;
  matchedByOptions?: string[];
}

/**
 * Filters for match approval interface
 */
export const MatchApprovalFilters: React.FC<MatchApprovalFiltersProps> = ({
  onFilterChange,
  initialFilter = {},
  matchedByOptions = [],
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<MatchApprovalFilter>(initialFilter);

  const handleSearch = (values: any) => {
    const filter: MatchApprovalFilter = {
      search: values.search || undefined,
      confidenceLevel: values.confidenceLevel?.length > 0 ? values.confidenceLevel : undefined,
      status: values.status?.length > 0 ? values.status : undefined,
      dateFrom: values.dateRange?.[0]?.toISOString() || undefined,
      dateTo: values.dateRange?.[1]?.toISOString() || undefined,
      amountMin: values.amountMin || undefined,
      amountMax: values.amountMax || undefined,
      matchType: values.matchType?.length > 0 ? values.matchType : undefined,
      matchedBy: values.matchedBy?.length > 0 ? values.matchedBy : undefined,
    };

    setActiveFilters(filter);
    onFilterChange(filter);
  };

  const handleClear = () => {
    form.resetFields();
    setActiveFilters({});
    onFilterChange({});
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (activeFilters.search) count++;
    if (activeFilters.confidenceLevel && activeFilters.confidenceLevel.length > 0) count++;
    if (activeFilters.status && activeFilters.status.length > 0) count++;
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.amountMin || activeFilters.amountMax) count++;
    if (activeFilters.matchType && activeFilters.matchType.length > 0) count++;
    if (activeFilters.matchedBy && activeFilters.matchedBy.length > 0) count++;
    return count;
  };

  const confidenceLevelOptions = [
    { label: 'High Confidence (85%+)', value: 'high' },
    { label: 'Medium Confidence (65-84%)', value: 'medium' },
    { label: 'Low Confidence (<65%)', value: 'low' },
  ];

  const statusOptions = [
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const matchTypeOptions = [
    { label: 'Auto-Matched', value: 'automatic' },
    { label: 'Manual Match', value: 'manual' },
    { label: 'Suggested', value: 'suggested' },
  ];

  return (
    <Card
      size="small"
      title={
        <Space>
          <FilterOutlined />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <Badge count={getActiveFilterCount()} />
          )}
        </Space>
      }
      extra={
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={handleClear}
          disabled={getActiveFilterCount() === 0}
        >
          Clear All
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
        initialValues={initialFilter}
      >
        {/* Search */}
        <Form.Item name="search" label="Search" style={{ marginBottom: 12 }}>
          <Input
            placeholder="Search description, reference..."
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>

        {/* Confidence Level */}
        <Form.Item name="confidenceLevel" label="Confidence" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All confidence levels"
            options={confidenceLevelOptions}
            allowClear
          />
        </Form.Item>

        {/* Status */}
        <Form.Item name="status" label="Status" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All statuses"
            options={statusOptions}
            allowClear
          />
        </Form.Item>

        {/* Match Type */}
        <Form.Item name="matchType" label="Match Type" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All types"
            options={matchTypeOptions}
            allowClear
          />
        </Form.Item>

        {/* Date Range */}
        <Form.Item name="dateRange" label="Date Range" style={{ marginBottom: 12 }}>
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* Amount Range */}
        <Row gutter={[12, 0]}>
          <Col span={12}>
            <Form.Item
              name="amountMin"
              label="Min Amount"
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                placeholder="0.00"
                prefix="$"
                style={{ width: '100%' }}
                min={0}
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="amountMax"
              label="Max Amount"
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                placeholder="0.00"
                prefix="$"
                style={{ width: '100%' }}
                min={0}
                precision={2}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Matched By */}
        {matchedByOptions.length > 0 && (
          <Form.Item name="matchedBy" label="Matched By" style={{ marginBottom: 12 }}>
            <Select
              mode="multiple"
              placeholder="All users"
              options={matchedByOptions.map((user) => ({
                label: user,
                value: user,
              }))}
              allowClear
              showSearch
            />
          </Form.Item>
        )}

        {/* Apply Button */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} block>
            Apply Filters
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MatchApprovalFilters;
