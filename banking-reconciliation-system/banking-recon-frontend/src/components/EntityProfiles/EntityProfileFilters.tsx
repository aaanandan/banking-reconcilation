import React, { useState } from 'react';
import { Card, Form, Input, Select, Slider, Button, Space, Badge, Radio } from 'antd';
import { FilterOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { EntityProfileFilter } from '../../utils/entityProfileUtils';

interface EntityProfileFiltersProps {
  onFilterChange: (filter: EntityProfileFilter) => void;
  initialFilter?: EntityProfileFilter;
  industries?: string[];
  locations?: string[];
  tags?: string[];
}

export const EntityProfileFilters: React.FC<EntityProfileFiltersProps> = ({
  onFilterChange,
  initialFilter = {},
  industries = [],
  locations = [],
  tags = [],
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<EntityProfileFilter>(initialFilter);

  const handleSearch = (values: any) => {
    const filter: EntityProfileFilter = {
      search: values.search || undefined,
      industry: values.industry?.length > 0 ? values.industry : undefined,
      location: values.location?.length > 0 ? values.location : undefined,
      tags: values.tags?.length > 0 ? values.tags : undefined,
      hasParent: values.hasParent,
      hasSubsidiaries: values.hasSubsidiaries,
      minConfidence: values.confidenceRange?.[0] / 100 || undefined,
      maxConfidence: values.confidenceRange?.[1] / 100 || undefined,
      minTransactions: values.minTransactions || undefined,
      hasFrequencyPattern: values.hasFrequencyPattern,
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
    if (activeFilters.industry && activeFilters.industry.length > 0) count++;
    if (activeFilters.location && activeFilters.location.length > 0) count++;
    if (activeFilters.tags && activeFilters.tags.length > 0) count++;
    if (activeFilters.hasParent !== undefined) count++;
    if (activeFilters.hasSubsidiaries !== undefined) count++;
    if (activeFilters.minConfidence !== undefined || activeFilters.maxConfidence !== undefined) count++;
    if (activeFilters.minTransactions !== undefined) count++;
    if (activeFilters.hasFrequencyPattern !== undefined) count++;
    return count;
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <FilterOutlined />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && <Badge count={getActiveFilterCount()} />}
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
      <Form form={form} layout="vertical" onFinish={handleSearch} initialValues={initialFilter}>
        <Form.Item name="search" label="Search" style={{ marginBottom: 12 }}>
          <Input placeholder="Name, legal name, aliases..." prefix={<SearchOutlined />} allowClear />
        </Form.Item>

        <Form.Item name="industry" label="Industry" style={{ marginBottom: 12 }}>
          <Select mode="multiple" placeholder="All industries" options={industries.map(i => ({ label: i, value: i }))} allowClear />
        </Form.Item>

        <Form.Item name="location" label="Location" style={{ marginBottom: 12 }}>
          <Select mode="multiple" placeholder="All locations" options={locations.map(l => ({ label: l, value: l }))} allowClear />
        </Form.Item>

        <Form.Item name="tags" label="Tags" style={{ marginBottom: 12 }}>
          <Select mode="multiple" placeholder="All tags" options={tags.map(t => ({ label: t, value: t }))} allowClear />
        </Form.Item>

        <Form.Item name="confidenceRange" label="Confidence Range (%)" style={{ marginBottom: 12 }}>
          <Slider range min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
        </Form.Item>

        <Form.Item name="minTransactions" label="Min Transactions" style={{ marginBottom: 12 }}>
          <Input type="number" placeholder="0" min={0} />
        </Form.Item>

        <Form.Item name="hasParent" label="Parent Company" style={{ marginBottom: 12 }}>
          <Radio.Group>
            <Radio value={undefined}>All</Radio>
            <Radio value={true}>With Parent</Radio>
            <Radio value={false}>No Parent</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="hasSubsidiaries" label="Subsidiaries" style={{ marginBottom: 12 }}>
          <Radio.Group>
            <Radio value={undefined}>All</Radio>
            <Radio value={true}>Has Subs</Radio>
            <Radio value={false}>No Subs</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="hasFrequencyPattern" label="Frequency Pattern" style={{ marginBottom: 12 }}>
          <Radio.Group>
            <Radio value={undefined}>All</Radio>
            <Radio value={true}>Known</Radio>
            <Radio value={false}>Unknown</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} block>
            Apply Filters
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EntityProfileFilters;
