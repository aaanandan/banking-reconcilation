import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Space, Badge, Radio } from 'antd';
import { FilterOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import {
  QuestionFilter,
  QuestionType,
  QuestionPriority,
  QuestionTiming,
  getQuestionTypeLabel,
  getPriorityLabel,
  getTimingLabel,
} from '../../utils/learningQuestionUtils';

interface QuestionFiltersProps {
  onFilterChange: (filter: QuestionFilter) => void;
  initialFilter?: QuestionFilter;
}

/**
 * Filters for learning questions interface
 */
export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  onFilterChange,
  initialFilter = {},
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<QuestionFilter>(initialFilter);

  const handleSearch = (values: any) => {
    const filter: QuestionFilter = {
      search: values.search || undefined,
      type: values.type?.length > 0 ? values.type : undefined,
      priority: values.priority?.length > 0 ? values.priority : undefined,
      timing: values.timing?.length > 0 ? values.timing : undefined,
      answered: values.answered,
      expired: values.expired,
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
    if (activeFilters.type && activeFilters.type.length > 0) count++;
    if (activeFilters.priority && activeFilters.priority.length > 0) count++;
    if (activeFilters.timing && activeFilters.timing.length > 0) count++;
    if (activeFilters.answered !== undefined) count++;
    if (activeFilters.expired !== undefined) count++;
    return count;
  };

  const typeOptions = Object.values(QuestionType).map((type) => ({
    label: getQuestionTypeLabel(type),
    value: type,
  }));

  const priorityOptions = Object.values(QuestionPriority).map((priority) => ({
    label: getPriorityLabel(priority),
    value: priority,
  }));

  const timingOptions = Object.values(QuestionTiming).map((timing) => ({
    label: getTimingLabel(timing),
    value: timing,
  }));

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
        {/* Search */}
        <Form.Item name="search" label="Search" style={{ marginBottom: 12 }}>
          <Input
            placeholder="Search question, context..."
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>

        {/* Question Type */}
        <Form.Item name="type" label="Question Type" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All types"
            options={typeOptions}
            allowClear
            maxTagCount="responsive"
          />
        </Form.Item>

        {/* Priority */}
        <Form.Item name="priority" label="Priority" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All priorities"
            options={priorityOptions}
            allowClear
            maxTagCount="responsive"
          />
        </Form.Item>

        {/* Timing */}
        <Form.Item name="timing" label="Timing" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="All timings"
            options={timingOptions}
            allowClear
            maxTagCount="responsive"
          />
        </Form.Item>

        {/* Answered Status */}
        <Form.Item name="answered" label="Status" style={{ marginBottom: 12 }}>
          <Radio.Group>
            <Radio value={undefined}>All</Radio>
            <Radio value={false}>Unanswered</Radio>
            <Radio value={true}>Answered</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Expired */}
        <Form.Item name="expired" label="Expiration" style={{ marginBottom: 12 }}>
          <Radio.Group>
            <Radio value={undefined}>All</Radio>
            <Radio value={false}>Active</Radio>
            <Radio value={true}>Expired</Radio>
          </Radio.Group>
        </Form.Item>

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

export default QuestionFilters;
