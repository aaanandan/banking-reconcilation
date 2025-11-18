import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Button,
  Space,
  Row,
  Col,
  Collapse,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import {
  TransactionFilter,
  TransactionStatus,
  TransactionType,
  TransactionSource,
} from '../../types/transaction';

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface TransactionFiltersProps {
  onFilterChange: (filter: TransactionFilter) => void;
  initialFilter?: TransactionFilter;
  categories?: string[];
  payees?: string[];
  uploadIds?: Array<{ id: string; name: string }>;
  showAdvancedFilters?: boolean;
  compact?: boolean;
}

/**
 * Transaction filters component
 * Provides filtering capabilities for transaction list
 */
export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFilterChange,
  initialFilter = {},
  categories = [],
  payees = [],
  uploadIds = [],
  showAdvancedFilters = true,
  compact = false,
}) => {
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<TransactionFilter>(initialFilter);

  const handleSearch = (values: any) => {
    const filter: TransactionFilter = {
      search: values.search || undefined,
      dateFrom: values.dateRange?.[0]?.toISOString() || undefined,
      dateTo: values.dateRange?.[1]?.toISOString() || undefined,
      amountMin: values.amountMin || undefined,
      amountMax: values.amountMax || undefined,
      status: values.status?.length > 0 ? values.status : undefined,
      type: values.type?.length > 0 ? values.type : undefined,
      source: values.source?.length > 0 ? values.source : undefined,
      category: values.category?.length > 0 ? values.category : undefined,
      payee: values.payee?.length > 0 ? values.payee : undefined,
      matched: values.matched,
      uploadId: values.uploadId || undefined,
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
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.amountMin || activeFilters.amountMax) count++;
    if (activeFilters.status && activeFilters.status.length > 0) count++;
    if (activeFilters.type && activeFilters.type.length > 0) count++;
    if (activeFilters.source && activeFilters.source.length > 0) count++;
    if (activeFilters.category && activeFilters.category.length > 0) count++;
    if (activeFilters.payee && activeFilters.payee.length > 0) count++;
    if (activeFilters.matched !== undefined) count++;
    if (activeFilters.uploadId) count++;
    return count;
  };

  const statusOptions: Array<{ label: string; value: TransactionStatus }> = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Matched', value: 'matched' },
    { label: 'Unmatched', value: 'unmatched' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const typeOptions: Array<{ label: string; value: TransactionType }> = [
    { label: 'Debit', value: 'debit' },
    { label: 'Credit', value: 'credit' },
    { label: 'Both', value: 'both' },
  ];

  const sourceOptions: Array<{ label: string; value: TransactionSource }> = [
    { label: 'Bank Statement', value: 'bank_statement' },
    { label: 'Internal Ledger', value: 'internal_ledger' },
    { label: 'Manual Entry', value: 'manual_entry' },
  ];

  const matchedOptions = [
    { label: 'Matched', value: true },
    { label: 'Unmatched', value: false },
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

        {/* Basic Filters */}
        <Row gutter={[12, 0]}>
          <Col span={12}>
            <Form.Item name="status" label="Status" style={{ marginBottom: 12 }}>
              <Select
                mode="multiple"
                placeholder="All statuses"
                options={statusOptions}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Type" style={{ marginBottom: 12 }}>
              <Select
                mode="multiple"
                placeholder="All types"
                options={typeOptions}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Date Range */}
        <Form.Item name="dateRange" label="Date Range" style={{ marginBottom: 12 }}>
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Collapse
            ghost
            expandIcon={({ isActive }) => (
              <DownOutlined rotate={isActive ? 180 : 0} />
            )}
          >
            <Panel header="Advanced Filters" key="advanced">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
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

                {/* Source */}
                <Form.Item name="source" label="Source" style={{ marginBottom: 12 }}>
                  <Select
                    mode="multiple"
                    placeholder="All sources"
                    options={sourceOptions}
                    allowClear
                  />
                </Form.Item>

                {/* Category */}
                {categories.length > 0 && (
                  <Form.Item
                    name="category"
                    label="Category"
                    style={{ marginBottom: 12 }}
                  >
                    <Select
                      mode="multiple"
                      placeholder="All categories"
                      options={categories.map((cat) => ({
                        label: cat,
                        value: cat,
                      }))}
                      allowClear
                    />
                  </Form.Item>
                )}

                {/* Payee */}
                {payees.length > 0 && (
                  <Form.Item name="payee" label="Payee" style={{ marginBottom: 12 }}>
                    <Select
                      mode="multiple"
                      placeholder="All payees"
                      options={payees.map((payee) => ({
                        label: payee,
                        value: payee,
                      }))}
                      allowClear
                      showSearch
                    />
                  </Form.Item>
                )}

                {/* Matched Status */}
                <Form.Item
                  name="matched"
                  label="Match Status"
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    placeholder="All transactions"
                    options={matchedOptions}
                    allowClear
                  />
                </Form.Item>

                {/* Upload ID */}
                {uploadIds.length > 0 && (
                  <Form.Item
                    name="uploadId"
                    label="Upload File"
                    style={{ marginBottom: 12 }}
                  >
                    <Select
                      placeholder="All uploads"
                      options={uploadIds.map((upload) => ({
                        label: upload.name,
                        value: upload.id,
                      }))}
                      allowClear
                      showSearch
                    />
                  </Form.Item>
                )}
              </Space>
            </Panel>
          </Collapse>
        )}

        {/* Apply Button */}
        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} block>
            Apply Filters
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TransactionFilters;
