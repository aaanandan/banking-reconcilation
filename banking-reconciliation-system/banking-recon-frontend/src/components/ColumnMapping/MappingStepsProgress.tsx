import React from 'react';
import { Steps, Card, Typography, Space, Tag } from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { ColumnMapping, DetectedColumn } from '../../services/dataPrepService';
import { calculateMappingStatistics } from '../../utils/mappingOperations';

const { Text } = Typography;

export type MappingStep =
  | 'upload'
  | 'detect'
  | 'map'
  | 'validate'
  | 'preview'
  | 'complete';

interface MappingStepsProgressProps {
  currentStep: MappingStep;
  mappings?: ColumnMapping[];
  detectedColumns?: DetectedColumn[];
  onStepClick?: (step: MappingStep) => void;
  showDetails?: boolean;
}

const STEP_ORDER: MappingStep[] = [
  'upload',
  'detect',
  'map',
  'validate',
  'preview',
  'complete',
];

const STEP_CONFIG: Record<
  MappingStep,
  {
    title: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  upload: {
    title: 'Upload File',
    icon: <UploadOutlined />,
    description: 'Upload your CSV or Excel file',
  },
  detect: {
    title: 'Detect Columns',
    icon: <SearchOutlined />,
    description: 'Auto-detect column types',
  },
  map: {
    title: 'Map Columns',
    icon: <LinkOutlined />,
    description: 'Map columns to target fields',
  },
  validate: {
    title: 'Validate',
    icon: <CheckCircleOutlined />,
    description: 'Verify mappings are correct',
  },
  preview: {
    title: 'Preview',
    icon: <EyeOutlined />,
    description: 'Review transformed data',
  },
  complete: {
    title: 'Complete',
    icon: <RocketOutlined />,
    description: 'Ready to process',
  },
};

/**
 * Progress indicator for column mapping workflow
 */
export const MappingStepsProgress: React.FC<MappingStepsProgressProps> = ({
  currentStep,
  mappings = [],
  detectedColumns = [],
  onStepClick,
  showDetails = true,
}) => {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  const getStepStatus = (
    step: MappingStep
  ): 'wait' | 'process' | 'finish' | 'error' => {
    const stepIndex = STEP_ORDER.indexOf(step);

    if (stepIndex < currentStepIndex) {
      return 'finish';
    } else if (stepIndex === currentStepIndex) {
      return 'process';
    } else {
      return 'wait';
    }
  };

  const getStepDetails = (step: MappingStep): React.ReactNode => {
    if (!showDetails) return null;

    switch (step) {
      case 'detect':
        if (detectedColumns.length > 0) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {detectedColumns.length} column(s) detected
            </Text>
          );
        }
        break;

      case 'map':
        if (mappings.length > 0) {
          const stats = calculateMappingStatistics(detectedColumns, mappings);
          return (
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.mappedColumns}/{stats.totalColumns} mapped
              </Text>
              {stats.missingRequired.length === 0 ? (
                <Tag color="success" style={{ fontSize: 10 }}>
                  Required OK
                </Tag>
              ) : (
                <Tag color="error" style={{ fontSize: 10 }}>
                  {stats.missingRequired.length} missing
                </Tag>
              )}
            </Space>
          );
        }
        break;

      case 'validate':
        if (mappings.length > 0 && detectedColumns.length > 0) {
          const stats = calculateMappingStatistics(detectedColumns, mappings);
          const hasErrors =
            stats.missingRequired.length > 0 || stats.duplicateTargets.length > 0;

          if (hasErrors) {
            return (
              <Tag color="error" style={{ fontSize: 10 }}>
                {stats.missingRequired.length + stats.duplicateTargets.length}{' '}
                issue(s)
              </Tag>
            );
          } else {
            return (
              <Tag color="success" style={{ fontSize: 10 }}>
                Validated
              </Tag>
            );
          }
        }
        break;

      default:
        return null;
    }

    return null;
  };

  const handleStepClick = (current: number) => {
    if (onStepClick) {
      const step = STEP_ORDER[current];
      onStepClick(step);
    }
  };

  return (
    <Card size="small">
      <Steps
        current={currentStepIndex}
        onChange={onStepClick ? handleStepClick : undefined}
        items={STEP_ORDER.map((step) => {
          const config = STEP_CONFIG[step];
          return {
            title: config.title,
            description: (
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {config.description}
                </Text>
                {getStepDetails(step)}
              </Space>
            ),
            icon: config.icon,
            status: getStepStatus(step),
          };
        })}
      />
    </Card>
  );
};

export default MappingStepsProgress;
