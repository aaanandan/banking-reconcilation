import React, { useState } from 'react';
import { Modal, Form, Select, DatePicker, Switch, Button, Space, Alert, Typography } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import {
  ReportType,
  ExportFormat,
  ReportFilter,
  REPORT_TEMPLATES,
  getExportFormatLabel,
  validateDateRange,
  getDateRangePresets,
} from '../../utils/reportUtils';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface ReportGeneratorModalProps {
  visible: boolean;
  onGenerate: (type: ReportType, format: ExportFormat, filter: ReportFilter) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  visible,
  onGenerate,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);

  const selectedTemplate = REPORT_TEMPLATES.find((t) => t.type === selectedType);

  const handleGenerate = () => {
    form.validateFields().then((values) => {
      const validation = validateDateRange(
        values.dateRange[0].format('YYYY-MM-DD'),
        values.dateRange[1].format('YYYY-MM-DD')
      );

      if (!validation.valid) {
        form.setFields([
          {
            name: 'dateRange',
            errors: [validation.error || 'Invalid date range'],
          },
        ]);
        return;
      }

      const filter: ReportFilter = {
        dateFrom: values.dateRange[0].format('YYYY-MM-DD'),
        dateTo: values.dateRange[1].format('YYYY-MM-DD'),
        includeCharts: values.includeCharts !== undefined ? values.includeCharts : true,
        includeDetails: values.includeDetails !== undefined ? values.includeDetails : true,
      };

      onGenerate(values.reportType, values.format, filter);
      form.resetFields();
      setSelectedType(null);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedType(null);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <FileAddOutlined />
          <span>Generate Report</span>
        </Space>
      }
      open={visible}
      onOk={handleGenerate}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Generate Report"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reportType"
          label="Report Type"
          rules={[{ required: true, message: 'Please select a report type' }]}
        >
          <Select
            placeholder="Select report type"
            onChange={(value) => setSelectedType(value)}
            options={REPORT_TEMPLATES.map((t) => ({
              label: t.title,
              value: t.type,
            }))}
          />
        </Form.Item>

        {selectedTemplate && (
          <Alert
            message={selectedTemplate.description}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="format"
          label="Export Format"
          rules={[{ required: true, message: 'Please select a format' }]}
          initialValue={selectedTemplate?.defaultFormat}
        >
          <Select
            placeholder="Select format"
            options={
              selectedTemplate
                ? selectedTemplate.supportedFormats.map((f) => ({
                    label: getExportFormatLabel(f),
                    value: f,
                  }))
                : Object.values(ExportFormat).map((f) => ({
                    label: getExportFormatLabel(f),
                    value: f,
                  }))
            }
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select a date range' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            presets={getDateRangePresets().map((preset) => ({
              label: preset.label,
              value: [new Date(preset.value[0]), new Date(preset.value[1])],
            }))}
          />
        </Form.Item>

        <Form.Item name="includeCharts" label="Include Charts" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>

        <Form.Item name="includeDetails" label="Include Detailed Data" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>

        {selectedTemplate && (
          <div style={{ padding: 12, backgroundColor: '#f0f5ff', borderRadius: 4, marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Estimated generation time: {selectedTemplate.estimatedTime}
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ReportGeneratorModal;
