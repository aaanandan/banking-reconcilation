import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Form,
  Card,
  Row,
  Col,
  Tag,
  Empty,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Typography,
  Space,
  Badge,
} from 'antd';
import {
  SaveOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  getAllTemplates,
  getTemplatesByType,
  getRecentTemplates,
  saveTemplate,
  deleteTemplate,
  applyTemplate,
  findMatchingTemplates,
  exportTemplates,
  importTemplates,
  MappingTemplate,
  TemplateMatchScore,
} from '../../utils/mappingTemplates';
import { ColumnMapping } from '../../services/dataPrepService';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

interface MappingTemplatesManagerProps {
  visible: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  fileType: 'bank' | 'ledger';
  currentMappings?: ColumnMapping[];
  detectedColumnNames?: string[];
  onApplyTemplate?: (mappings: ColumnMapping[]) => void;
}

/**
 * Component for managing mapping templates
 * Allows saving, loading, searching, and deleting templates
 */
export const MappingTemplatesManager: React.FC<MappingTemplatesManagerProps> = ({
  visible,
  onClose,
  mode,
  fileType,
  currentMappings = [],
  detectedColumnNames = [],
  onApplyTemplate,
}) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MappingTemplate[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<MappingTemplate[]>([]);
  const [matchingTemplates, setMatchingTemplates] = useState<TemplateMatchScore[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MappingTemplate | null>(null);

  // Load templates when modal opens
  useEffect(() => {
    if (visible) {
      loadTemplates();
      loadRecentTemplates();

      if (mode === 'load' && detectedColumnNames.length > 0) {
        findMatches();
      }
    }
  }, [visible, fileType, detectedColumnNames, mode]);

  // Filter templates based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.bankName?.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  const loadTemplates = () => {
    const allTemplates = getTemplatesByType(fileType);
    setTemplates(allTemplates);
    setFilteredTemplates(allTemplates);
  };

  const loadRecentTemplates = () => {
    const recent = getRecentTemplates().filter((t) => t.fileType === fileType);
    setRecentTemplates(recent);
  };

  const findMatches = () => {
    const matches = findMatchingTemplates(detectedColumnNames, fileType, 5);
    setMatchingTemplates(matches);
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await form.validateFields();

      const newTemplate = saveTemplate({
        name: values.name,
        description: values.description || '',
        bankName: values.bankName,
        fileType,
        mappings: currentMappings,
        tags: values.tags || [],
      });

      message.success(`Template "${newTemplate.name}" saved successfully!`);
      form.resetFields();
      loadTemplates();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      message.error('Failed to save template');
    }
  };

  const handleLoadTemplate = (template: MappingTemplate) => {
    if (!onApplyTemplate) return;

    const mappings = applyTemplate(template, detectedColumnNames);

    if (mappings.length === 0) {
      message.warning(
        `Template "${template.name}" could not be applied. No matching columns found.`
      );
      return;
    }

    onApplyTemplate(mappings);
    message.success(
      `Template "${template.name}" applied! ${mappings.length} mappings loaded.`
    );
    onClose();
  };

  const handleDeleteTemplate = (template: MappingTemplate) => {
    const success = deleteTemplate(template.id);

    if (success) {
      message.success(`Template "${template.name}" deleted`);
      loadTemplates();
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }
    } else {
      message.error('Failed to delete template');
    }
  };

  const handleExportTemplates = () => {
    try {
      const json = exportTemplates();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mapping-templates-${fileType}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('Templates exported successfully');
    } catch (error) {
      message.error('Failed to export templates');
    }
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const result = importTemplates(json);

        if (result.success > 0) {
          message.success(
            `${result.success} template(s) imported successfully`
          );
          loadTemplates();
        }

        if (result.failed > 0) {
          message.warning(
            `${result.failed} template(s) failed to import: ${result.errors.join(', ')}`
          );
        }
      } catch (error) {
        message.error('Failed to import templates');
      }
    };
    reader.readAsText(file);
  };

  const renderSaveMode = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Template Name"
        name="name"
        rules={[{ required: true, message: 'Please enter a template name' }]}
      >
        <Input placeholder="e.g., HDFC Bank Statement" />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <TextArea
          rows={3}
          placeholder="Describe this template (optional)"
        />
      </Form.Item>

      <Form.Item label="Bank Name" name="bankName">
        <Input placeholder="e.g., HDFC Bank (optional)" />
      </Form.Item>

      <Form.Item label="Tags" name="tags">
        <Select mode="tags" placeholder="Add tags (optional)">
          <Option value="Bank">Bank</Option>
          <Option value="Ledger">Ledger</Option>
          <Option value="Standard">Standard</Option>
          <Option value="Debit-Credit">Debit-Credit</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Text type="secondary">
          This template will save {currentMappings.length} column mapping(s) for
          reuse.
        </Text>
      </Form.Item>
    </Form>
  );

  const renderLoadMode = () => (
    <div>
      {/* Search */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search templates by name, bank, or tags..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {/* Recommended Matches */}
      {matchingTemplates.length > 0 && (
        <>
          <Title level={5}>
            <StarFilled style={{ color: '#faad14' }} /> Recommended Templates
          </Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {matchingTemplates.map(({ template, score, matchedColumns, totalColumns }) => (
              <Col span={24} key={template.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleLoadTemplate(template)}
                  style={{ borderColor: '#1890ff' }}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space direction="vertical" size={0}>
                        <Text strong>{template.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {template.description}
                        </Text>
                        <Space size={4}>
                          <Tag color="blue">
                            {matchedColumns}/{totalColumns} columns match
                          </Tag>
                          <Tag color="green">{score}% match score</Tag>
                          {template.bankName && (
                            <Tag>{template.bankName}</Tag>
                          )}
                        </Space>
                      </Space>
                    </Col>
                    <Col>
                      <Button type="primary">Apply</Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
          <Divider />
        </>
      )}

      {/* Recent Templates */}
      {recentTemplates.length > 0 && (
        <>
          <Title level={5}>
            <ClockCircleOutlined /> Recently Used
          </Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {recentTemplates.map((template) => (
              <Col span={24} key={template.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleLoadTemplate(template)}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space direction="vertical" size={0}>
                        <Text strong>{template.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {template.description}
                        </Text>
                        <Space size={4}>
                          {template.tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </Space>
                      </Space>
                    </Col>
                    <Col>
                      <Button type="default">Apply</Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
          <Divider />
        </>
      )}

      {/* All Templates */}
      <Title level={5}>All Templates</Title>
      {filteredTemplates.length === 0 ? (
        <Empty description="No templates found" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredTemplates.map((template) => (
            <Col span={24} key={template.id}>
              <Card
                size="small"
                hoverable
                onClick={() => handleLoadTemplate(template)}
                actions={
                  !template.id.startsWith('template_')
                    ? [
                        <Popconfirm
                          title="Are you sure you want to delete this template?"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteTemplate(template);
                          }}
                          okText="Yes"
                          cancelText="No"
                        >
                          <DeleteOutlined
                            key="delete"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>,
                      ]
                    : []
                }
              >
                <Row justify="space-between" align="middle">
                  <Col flex="auto">
                    <Space direction="vertical" size={0}>
                      <Space>
                        <Text strong>{template.name}</Text>
                        {template.id.startsWith('template_') && (
                          <Tag color="blue">Predefined</Tag>
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {template.description}
                      </Text>
                      <Space size={4} style={{ marginTop: 4 }}>
                        {template.bankName && (
                          <Tag color="green">{template.bankName}</Tag>
                        )}
                        {template.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                        <Tag>{template.mappings.length} mappings</Tag>
                      </Space>
                    </Space>
                  </Col>
                  <Col>
                    <Button type="primary">Apply</Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );

  return (
    <Modal
      title={
        <Space>
          {mode === 'save' ? <SaveOutlined /> : <FolderOpenOutlined />}
          {mode === 'save' ? 'Save Mapping Template' : 'Load Mapping Template'}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        mode === 'save' ? (
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleSaveTemplate} icon={<SaveOutlined />}>
              Save Template
            </Button>
          </Space>
        ) : (
          <Space>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              id="import-templates"
              onChange={handleImportTemplates}
            />
            <Button
              icon={<UploadOutlined />}
              onClick={() => document.getElementById('import-templates')?.click()}
            >
              Import
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportTemplates}>
              Export
            </Button>
            <Button onClick={onClose}>Close</Button>
          </Space>
        )
      }
    >
      {mode === 'save' ? renderSaveMode() : renderLoadMode()}
    </Modal>
  );
};
