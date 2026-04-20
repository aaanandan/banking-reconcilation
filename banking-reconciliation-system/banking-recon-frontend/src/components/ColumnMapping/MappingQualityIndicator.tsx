import React from 'react';
import { Card, Progress, Alert, Tag, Space, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface MappingQualityIndicatorProps {
  score: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
  missingRequired?: string[];
  warnings?: string[];
  errors?: string[];
}

export const MappingQualityIndicator: React.FC<MappingQualityIndicatorProps> = ({
  score,
  grade,
  feedback,
  missingRequired = [],
  warnings = [],
  errors = [],
}) => {
  const getGradeColor = () => {
    switch (grade) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'processing';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgressColor = () => {
    if (score >= 90) return '#52c41a';
    if (score >= 75) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getGradeIcon = () => {
    switch (grade) {
      case 'excellent':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'good':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'fair':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'poor':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          {getGradeIcon()}
          <span>Mapping Quality</span>
          <Tag color={getGradeColor()}>{grade.toUpperCase()}</Tag>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Progress Bar */}
        <div>
          <Tooltip title={`Quality Score: ${score.toFixed(0)}/100`}>
            <Progress
              percent={score}
              strokeColor={getProgressColor()}
              format={percent => `${percent?.toFixed(0)}%`}
            />
          </Tooltip>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {feedback}
          </Text>
        </div>

        {/* Missing Required Fields */}
        {missingRequired.length > 0 && (
          <Alert
            message="Missing Required Fields"
            description={
              <div>
                <Text>The following required fields are not mapped:</Text>
                <div style={{ marginTop: 8 }}>
                  {missingRequired.map(field => (
                    <Tag key={field} color="error">
                      {field}
                    </Tag>
                  ))}
                </div>
              </div>
            }
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
          />
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert
            message="Mapping Errors"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {errors.map((error, idx) => (
                  <li key={idx}>
                    <Text type="danger">{error}</Text>
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        )}

        {/* Warnings */}
        {warnings.length > 0 && errors.length === 0 && (
          <Alert
            message="Mapping Warnings"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {warnings.map((warning, idx) => (
                  <li key={idx}>
                    <Text>{warning}</Text>
                  </li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
          />
        )}

        {/* Success Message */}
        {errors.length === 0 && warnings.length === 0 && missingRequired.length === 0 && (
          <Alert
            message="All mappings validated successfully"
            description="Your column mappings are ready for reconciliation"
            type="success"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default MappingQualityIndicator;
