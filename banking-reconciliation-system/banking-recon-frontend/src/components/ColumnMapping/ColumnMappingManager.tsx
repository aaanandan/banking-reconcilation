import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  message,
  Modal,
  Tabs,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ColumnMapping, DetectedColumn } from '../../services/dataPrepService';
import { MappingHistoryManager } from '../../utils/mappingHistory';
import { MappingStepsProgress, MappingStep } from './MappingStepsProgress';
import { MappingActionsToolbar } from './MappingActionsToolbar';
import { MappingStatistics } from './MappingStatistics';
import { MappingValidationPanel } from './MappingValidationPanel';
import { MappingPreview } from './MappingPreview';
import { EdgeCaseHandler } from './EdgeCaseHandler';
import { MappingTemplatesManager } from './MappingTemplatesManager';
import { BestPracticesPanel } from './BestPracticesPanel';
import { PerformanceMonitor } from './PerformanceMonitor';
import { MappingQualityIndicator } from './MappingQualityIndicator';
import { AdvancedValidationPanel } from './AdvancedValidationPanel';
import { validateAllMappings } from '../../utils/mappingValidation';

interface ColumnMappingManagerProps {
  detectedColumns: DetectedColumn[];
  initialMappings?: ColumnMapping[];
  onSave: (mappings: ColumnMapping[]) => void;
  onCancel?: () => void;
  fileName?: string;
  rowCount?: number;
  showAdvancedFeatures?: boolean;
}

/**
 * Comprehensive column mapping management component
 * Integrates all mapping features: actions, statistics, validation, preview, etc.
 */
export const ColumnMappingManager: React.FC<ColumnMappingManagerProps> = ({
  detectedColumns,
  initialMappings = [],
  onSave,
  onCancel,
  fileName = 'Uploaded File',
  rowCount = 0,
  showAdvancedFeatures = true,
}) => {
  // State
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const [currentStep, setCurrentStep] = useState<MappingStep>('map');
  const [fixedColumns, setFixedColumns] = useState<DetectedColumn[]>(detectedColumns);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('mapping');

  // History manager for undo/redo
  const historyManager = useMemo(() => {
    const manager = new MappingHistoryManager(50);
    if (initialMappings.length > 0) {
      manager.push(initialMappings, 'Initial mappings');
    }
    return manager;
  }, [initialMappings]);

  // Validation
  const validation = useMemo(
    () => validateAllMappings(mappings, fixedColumns),
    [mappings, fixedColumns]
  );

  // Handlers
  const handleMappingsChange = useCallback(
    (newMappings: ColumnMapping[], description?: string) => {
      historyManager.push(newMappings, description || 'Mapping change');
      setMappings(newMappings);
    },
    [historyManager]
  );

  const handleMappingChange = useCallback(
    (sourceColumn: string, targetField: string | null) => {
      let newMappings: ColumnMapping[];

      if (targetField === null) {
        // Remove mapping
        newMappings = mappings.filter((m) => m.sourceColumn !== sourceColumn);
      } else {
        // Update or add mapping
        const existingIndex = mappings.findIndex(
          (m) => m.sourceColumn === sourceColumn
        );

        if (existingIndex >= 0) {
          newMappings = [...mappings];
          newMappings[existingIndex] = { sourceColumn, targetField };
        } else {
          newMappings = [...mappings, { sourceColumn, targetField }];
        }
      }

      handleMappingsChange(newMappings, `Map ${sourceColumn} to ${targetField}`);
    },
    [mappings, handleMappingsChange]
  );

  const handleEdgeCaseFix = useCallback(
    (fixed: DetectedColumn[]) => {
      setFixedColumns(fixed);
      message.success('Column names fixed successfully');
    },
    []
  );

  const handleSave = () => {
    if (!validation.isComplete) {
      Modal.confirm({
        title: 'Incomplete Mappings',
        content: `${validation.missingRequired.length} required field(s) are missing. Do you want to continue anyway?`,
        okText: 'Continue',
        cancelText: 'Go Back',
        onOk: () => {
          onSave(mappings);
        },
      });
      return;
    }

    if (validation.duplicateMappings.length > 0) {
      Modal.error({
        title: 'Duplicate Mappings',
        content: `The following fields are mapped multiple times: ${validation.duplicateMappings.join(', ')}. Please fix before saving.`,
      });
      return;
    }

    onSave(mappings);
  };

  const handleCancel = () => {
    if (mappings.length > 0) {
      Modal.confirm({
        title: 'Discard Changes',
        content: 'Are you sure you want to discard all mappings?',
        okText: 'Discard',
        cancelText: 'Cancel',
        okButtonProps: { danger: true },
        onOk: () => {
          if (onCancel) {
            onCancel();
          }
        },
      });
    } else {
      if (onCancel) {
        onCancel();
      }
    }
  };

  const handlePreview = () => {
    if (mappings.length === 0) {
      message.warning('Please create at least one mapping before previewing');
      return;
    }
    setShowPreview(true);
  };

  const canProceed = validation.isComplete && validation.duplicateMappings.length === 0;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card size="small">
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size={0}>
                <h2 style={{ margin: 0 }}>Column Mapping</h2>
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {fileName} • {fixedColumns.length} column(s) • {rowCount.toLocaleString()} row(s)
                </span>
              </Space>
            </Col>
            <Col>
              <Space>
                {onCancel && (
                  <Button
                    icon={<RollbackOutlined />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  disabled={mappings.length === 0}
                >
                  Preview
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  disabled={!canProceed}
                >
                  Save & Continue
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Progress Steps */}
        <MappingStepsProgress
          currentStep={currentStep}
          mappings={mappings}
          detectedColumns={fixedColumns}
          onStepClick={setCurrentStep}
        />

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          {/* Left Column - Mapping Interface */}
          <Col span={16}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Actions Toolbar */}
              <MappingActionsToolbar
                mappings={mappings}
                detectedColumns={fixedColumns}
                historyManager={historyManager}
                onMappingsChange={handleMappingsChange}
              />

              {/* Tabs for Different Features */}
              <Card>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    {
                      key: 'mapping',
                      label: 'Column Mappings',
                      children: (
                        <div>
                          {/* TODO: Add actual mapping interface component here */}
                          <p>Mapping interface will be integrated here</p>
                          <p>This would include drag-drop, dropdowns, etc.</p>
                        </div>
                      ),
                    },
                    {
                      key: 'templates',
                      label: 'Templates',
                      children: (
                        <MappingTemplatesManager
                          currentMappings={mappings}
                          detectedColumns={fixedColumns}
                          onApplyTemplate={(template) => {
                            handleMappingsChange(template.mappings, 'Applied template');
                            message.success(`Template "${template.name}" applied`);
                          }}
                        />
                      ),
                    },
                    {
                      key: 'edge-cases',
                      label: 'Edge Cases',
                      children: (
                        <EdgeCaseHandler
                          columns={fixedColumns}
                          rowCount={rowCount}
                          onColumnsFixed={handleEdgeCaseFix}
                          autoFix={false}
                        />
                      ),
                    },
                    ...(showAdvancedFeatures
                      ? [
                          {
                            key: 'best-practices',
                            label: 'Best Practices',
                            children: (
                              <BestPracticesPanel
                                mappings={mappings}
                                detectedColumns={fixedColumns}
                              />
                            ),
                          },
                          {
                            key: 'performance',
                            label: 'Performance',
                            children: (
                              <PerformanceMonitor
                                mappings={mappings}
                                detectedColumns={fixedColumns}
                                rowCount={rowCount}
                              />
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </Card>
            </Space>
          </Col>

          {/* Right Column - Statistics & Validation */}
          <Col span={8}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Quality Indicator */}
              <MappingQualityIndicator
                mappings={mappings}
                detectedColumns={fixedColumns}
              />

              {/* Statistics */}
              <MappingStatistics
                mappings={mappings}
                detectedColumns={fixedColumns}
                showDetailed={true}
              />

              {/* Validation Panel */}
              <MappingValidationPanel
                mappings={mappings}
                detectedColumns={fixedColumns}
                showQualityScore={true}
                expandByDefault={!validation.isValid}
              />

              {/* Advanced Validation */}
              {showAdvancedFeatures && (
                <AdvancedValidationPanel
                  mappings={mappings}
                  detectedColumns={fixedColumns}
                />
              )}
            </Space>
          </Col>
        </Row>
      </Space>

      {/* Preview Modal */}
      <Modal
        title="Mapping Preview"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={null}
        width={1000}
      >
        <MappingPreview
          mappings={mappings}
          detectedColumns={fixedColumns}
          showSampleData={true}
        />
      </Modal>
    </div>
  );
};

export default ColumnMappingManager;
