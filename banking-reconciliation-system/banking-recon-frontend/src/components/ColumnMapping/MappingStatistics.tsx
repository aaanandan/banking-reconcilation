import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Typography, Space, Divider } from 'antd';
import {
  CheckCircleOutlined,
  DatabaseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { DetectedColumn, ColumnMapping } from '../../services/dataPrepService';
import { calculateMappingStatistics, MappingStatistics as Stats } from '../../utils/mappingOperations';

const { Text, Title } = Typography;

interface MappingStatisticsProps {
  mappings: ColumnMapping[];
  detectedColumns: DetectedColumn[];
  showDetailed?: boolean;
}

/**
 * Component to display mapping statistics and progress
 */
export const MappingStatistics: React.FC<MappingStatisticsProps> = ({
  mappings,
  detectedColumns,
  showDetailed = false,
}) => {
  const stats = calculateMappingStatistics(detectedColumns, mappings);

  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 100) return '#52c41a'; // green
    if (percentage >= 70) return '#1890ff'; // blue
    if (percentage >= 40) return '#faad14'; // orange
    return '#f5222d'; // red
  };

  const getCompletionStatus = (stats: Stats): 'success' | 'active' | 'exception' => {
    if (stats.missingRequired.length > 0) return 'exception';
    if (stats.completionPercentage >= 100) return 'success';
    return 'active';
  };

  return (
    <Card size="small" title={<><DatabaseOutlined /> Mapping Statistics</>}>
      {/* Overall Progress */}
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" style={{ marginBottom: 8 }}>
          <Col>
            <Text strong>Overall Completion</Text>
          </Col>
          <Col>
            <Text strong>{stats.completionPercentage}%</Text>
          </Col>
        </Row>
        <Progress
          percent={stats.completionPercentage}
          status={getCompletionStatus(stats)}
          strokeColor={getCompletionColor(stats.completionPercentage)}
        />
      </div>

      {/* Key Metrics */}
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="Mapped"
            value={stats.mappedColumns}
            suffix={`/ ${stats.totalColumns}`}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Required"
            value={stats.requiredMapped}
            suffix={`/ ${stats.requiredTotal}`}
            valueStyle={{
              fontSize: 20,
              color:
                stats.requiredMapped === stats.requiredTotal
                  ? '#52c41a'
                  : '#f5222d',
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Optional"
            value={stats.optionalMapped}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
      </Row>

      {/* Missing Required Fields Alert */}
      {stats.missingRequired.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="danger" strong>
              <WarningOutlined /> Missing Required Fields:
            </Text>
            <Space size={4}>
              {stats.missingRequired.map((field) => (
                <Tag key={field} color="error">
                  {field}
                </Tag>
              ))}
            </Space>
          </Space>
        </div>
      )}

      {/* Duplicate Targets Alert */}
      {stats.duplicateTargets.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="danger" strong>
              <WarningOutlined /> Duplicate Target Fields:
            </Text>
            <Space size={4}>
              {stats.duplicateTargets.map((target) => (
                <Tag key={target} color="error">
                  {target}
                </Tag>
              ))}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Each target field should only be mapped once
            </Text>
          </Space>
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetailed && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <div>
            <Text strong>Mappings by Type:</Text>
            <div style={{ marginTop: 8 }}>
              {Object.entries(stats.mappingsByType).map(([type, count]) => (
                <Row
                  key={type}
                  justify="space-between"
                  style={{ marginBottom: 4 }}
                >
                  <Col>
                    <Tag color="blue">{type}</Tag>
                  </Col>
                  <Col>
                    <Text>{count} column(s)</Text>
                  </Col>
                </Row>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div>
            <Text strong>Summary:</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 12 }}>
              <li>
                {stats.mappedColumns} of {stats.totalColumns} columns mapped (
                {Math.round((stats.mappedColumns / stats.totalColumns) * 100)}%)
              </li>
              <li>
                {stats.unmappedColumns} unmapped columns
              </li>
              <li>
                Required fields: {stats.requiredMapped}/{stats.requiredTotal}
              </li>
              <li>Optional fields: {stats.optionalMapped} mapped</li>
            </ul>
          </div>
        </>
      )}

      {/* Success Message */}
      {stats.missingRequired.length === 0 &&
        stats.duplicateTargets.length === 0 &&
        stats.requiredMapped === stats.requiredTotal && (
          <div style={{ marginTop: 16 }}>
            <Text type="success">
              <CheckCircleOutlined /> All required fields are mapped!
            </Text>
          </div>
        )}
    </Card>
  );
};
