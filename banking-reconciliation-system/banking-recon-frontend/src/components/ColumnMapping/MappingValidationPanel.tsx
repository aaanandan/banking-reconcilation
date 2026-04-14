import React, { useMemo } from 'react';
import {
  Card,
  Alert,
  List,
  Space,
  Tag,
  Button,
  Typography,
  Collapse,
  Badge,
  Divider,
  Progress,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { ColumnMapping, DetectedColumn } from '../../services/dataPrepService';
import {
  validateAllMappings,
  calculateMappingQuality,
} from '../../utils/mappingValidation';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface MappingValidationPanelProps {
  mappings: ColumnMapping[];
  detectedColumns: DetectedColumn[];
  onAutoFix?: () => void;
  showQualityScore?: boolean;
  expandByDefault?: boolean;
}

/**
 * Panel to display validation results and quality scores for mappings
 */
export const MappingValidationPanel: React.FC<MappingValidationPanelProps> = ({
  mappings,
  detectedColumns,
  onAutoFix,
  showQualityScore = true,
  expandByDefault = false,
}) => {
  const validation = useMemo(
    () => validateAllMappings(mappings, detectedColumns),
    [mappings, detectedColumns]
  );

  const qualityScore = useMemo(
    () => calculateMappingQuality(mappings, detectedColumns),
    [mappings, detectedColumns]
  );

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getQualityColor = (grade: string): string => {
    switch (grade) {
      case 'excellent':
        return '#52c41a';
      case 'good':
        return '#1890ff';
      case 'fair':
        return '#faad14';
      case 'poor':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const getProgressStatus = (
    grade: string
  ): 'success' | 'active' | 'exception' => {
    switch (grade) {
      case 'excellent':
      case 'good':
        return 'success';
      case 'fair':
        return 'active';
      case 'poor':
        return 'exception';
      default:
        return 'active';
    }
  };

  // Group validation results by severity
  const errors = useMemo(() => {
    const errorList: Array<{ field: string; messages: string[] }> = [];

    if (!validation.isComplete) {
      errorList.push({
        field: 'Required Fields',
        messages: validation.missingRequired.map(
          (field) => `Missing required field: ${field}`
        ),
      });
    }

    if (validation.duplicateMappings.length > 0) {
      errorList.push({
        field: 'Duplicate Mappings',
        messages: validation.duplicateMappings.map(
          (field) => `Field "${field}" is mapped multiple times`
        ),
      });
    }

    validation.validationResults.forEach((result, sourceColumn) => {
      if (result.errors.length > 0) {
        errorList.push({
          field: sourceColumn,
          messages: result.errors,
        });
      }
    });

    return errorList;
  }, [validation]);

  const warnings = useMemo(() => {
    const warningList: Array<{ field: string; messages: string[] }> = [];

    validation.validationResults.forEach((result, sourceColumn) => {
      if (result.warnings.length > 0) {
        warningList.push({
          field: sourceColumn,
          messages: result.warnings,
        });
      }
    });

    return warningList;
  }, [validation]);

  const suggestions = useMemo(() => {
    const suggestionList: Array<{ field: string; messages: string[] }> = [];

    validation.validationResults.forEach((result, sourceColumn) => {
      if (result.suggestions.length > 0) {
        suggestionList.push({
          field: sourceColumn,
          messages: result.suggestions,
        });
      }
    });

    return suggestionList;
  }, [validation]);

  const hasIssues = errors.length > 0 || warnings.length > 0;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Quality Score */}
      {showQualityScore && (
        <Card size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Mapping Quality</Text>
              <Tag color={getQualityColor(qualityScore.grade)}>
                {qualityScore.grade.toUpperCase()}
              </Tag>
            </div>
            <Progress
              percent={qualityScore.score}
              status={getProgressStatus(qualityScore.grade)}
              strokeColor={getQualityColor(qualityScore.grade)}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {qualityScore.feedback}
            </Text>
          </Space>
        </Card>
      )}

      {/* Overall Status */}
      {validation.isComplete && validation.isValid ? (
        <Alert
          message="All Mappings Valid"
          description="All required fields are mapped and validated. Ready to proceed!"
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
        />
      ) : (
        <Alert
          message={
            validation.isComplete
              ? 'Mappings Need Attention'
              : 'Incomplete Mappings'
          }
          description={
            validation.isComplete
              ? 'Some mappings have validation issues that should be reviewed.'
              : `${validation.missingRequired.length} required field(s) are missing.`
          }
          type={validation.isComplete ? 'warning' : 'error'}
          icon={
            validation.isComplete ? (
              <WarningOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          showIcon
          action={
            onAutoFix && (
              <Button
                size="small"
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={onAutoFix}
              >
                Auto Fix
              </Button>
            )
          }
        />
      )}

      {/* Validation Details */}
      {hasIssues && (
        <Collapse
          defaultActiveKey={expandByDefault ? ['errors', 'warnings'] : []}
          ghost
        >
          {/* Errors */}
          {errors.length > 0 && (
            <Panel
              header={
                <Space>
                  <Badge count={errors.length} showZero={false}>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                  </Badge>
                  <Text strong style={{ color: '#ff4d4f' }}>
                    Errors ({errors.length})
                  </Text>
                </Space>
              }
              key="errors"
            >
              <List
                size="small"
                dataSource={errors}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text strong>{item.field}</Text>
                      {item.messages.map((msg, idx) => (
                        <Text key={idx} type="danger" style={{ fontSize: 12 }}>
                          • {msg}
                        </Text>
                      ))}
                    </Space>
                  </List.Item>
                )}
              />
            </Panel>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Panel
              header={
                <Space>
                  <Badge count={warnings.length} showZero={false}>
                    <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />
                  </Badge>
                  <Text strong style={{ color: '#faad14' }}>
                    Warnings ({warnings.length})
                  </Text>
                </Space>
              }
              key="warnings"
            >
              <List
                size="small"
                dataSource={warnings}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text strong>{item.field}</Text>
                      {item.messages.map((msg, idx) => (
                        <Text key={idx} type="warning" style={{ fontSize: 12 }}>
                          • {msg}
                        </Text>
                      ))}
                    </Space>
                  </List.Item>
                )}
              />
            </Panel>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Panel
              header={
                <Space>
                  <Badge count={suggestions.length} showZero={false}>
                    <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                  </Badge>
                  <Text strong style={{ color: '#1890ff' }}>
                    Suggestions ({suggestions.length})
                  </Text>
                </Space>
              }
              key="suggestions"
            >
              <List
                size="small"
                dataSource={suggestions}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text strong>{item.field}</Text>
                      {item.messages.map((msg, idx) => (
                        <Text key={idx} type="secondary" style={{ fontSize: 12 }}>
                          • {msg}
                        </Text>
                      ))}
                    </Space>
                  </List.Item>
                )}
              />
            </Panel>
          )}
        </Collapse>
      )}

      {/* Validation Summary */}
      <Divider style={{ margin: '8px 0' }} />
      <div>
        <Space size="large">
          <Space size={4}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {mappings.length} mapping(s)
            </Text>
          </Space>
          {validation.missingRequired.length > 0 && (
            <Space size={4}>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              <Text type="danger" style={{ fontSize: 12 }}>
                {validation.missingRequired.length} missing
              </Text>
            </Space>
          )}
          {validation.duplicateMappings.length > 0 && (
            <Space size={4}>
              <WarningOutlined style={{ color: '#faad14' }} />
              <Text type="warning" style={{ fontSize: 12 }}>
                {validation.duplicateMappings.length} duplicate(s)
              </Text>
            </Space>
          )}
          <Space size={4}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {Math.round(validation.overallConfidence)}% confidence
            </Text>
          </Space>
        </Space>
      </div>
    </Space>
  );
};

export default MappingValidationPanel;
