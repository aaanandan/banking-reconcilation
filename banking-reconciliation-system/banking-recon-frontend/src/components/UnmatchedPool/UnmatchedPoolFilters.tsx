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
  Radio,
} from 'antd';
import {
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { UnmatchedFilter } from '../../utils/unmatchedPoolUtils';

const { RangePicker } = DatePicker;

interface UnmatchedPoolFiltersProps {
  onFilterChange: (filter: UnmatchedFilter) => void;
  initialFilter?: UnmatchedFilter;
}

/**
 * Filters for unmatched pool interface
 */
export const UnmatchedPoolFilters: React.FC<UnmatchedPoolFiltersProps> = ({
  onFilterChange,
  initialFilter = {},
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<UnmatchedFilter>(initialFilter);

  const handleSearch = (values: any) => {
    const filter: UnmatchedFilter = {
      search: values.search || undefined,
      source: values.source?.length > 0 ? values.source : undefined,
      dateFrom: values.dateRange?.[0]?.toISOString() || undefined,
      dateTo: values.dateRange?.[1]?.toISOString() || undefined,
      amountMin: values.amountMin || undefined,
      amountMax: values.amountMax || undefined,
      hasAlternatives: values.hasAlternatives,
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
    if (activeFilters.source && activeFilters.source.length > 0) count++;
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.amountMin || activeFilters.amountMax) count++;
    if (activeFilters.hasAlternatives !== undefined) count++;
    return count;
  };

  const sourceOptions = [
    { label: 'Bank Statement', value: 'bank' },
    { label: 'Internal Ledger', value: 'ledger' },
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
            placeholder="Search description, reference, payee..."
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>

        {/* Source */}
        <Form.Item name="source" label="Source" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All sources"
            options={sourceOptions}
            allowClear
          />
        </Form.Item>

        {/* Has Alternatives */}
        <Form.Item name="hasAlternatives" label="Alternatives" style={{ marginBottom: 12 }}>
          <Radio.Group>
            <Radio value={undefined}>All</Radio>
            <Radio value={true}>With Alternatives</Radio>
            <Radio value={false}>Without Alternatives</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Date Range */}
        <Form.Item name="dateRange" label="Transaction Date Range" style={{ marginBottom: 12 }}>
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

export default UnmatchedPoolFilters;
