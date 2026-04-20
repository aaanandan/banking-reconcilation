import React, { useState, useEffect } from 'react';
import {
  Alert,
  Card,
  Collapse,
  Descriptions,
  Tag,
  Typography,
  Space,
  Progress,
  Table,
  Divider,
  Button,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  BugOutlined,
} from '@ant-design/icons';
import {
  EdgeCaseAnalysis,
  analyzeEdgeCases,
  sanitizeAllColumnNames,
  resolveDuplicateColumnNames,
} from '../../utils/edgeCaseHandling';
import { DetectedColumn } from '../../services/dataPrepService';

const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;

interface EdgeCaseHandlerProps {
  columns: DetectedColumn[];
  rowCount: number;
  onColumnsFixed?: (fixedColumns: DetectedColumn[]) => void;
  autoFix?: boolean;
}

/**
 * Component to detect, display, and fix edge cases
 * Handles large files, special characters, encoding, etc.
 */
export const EdgeCaseHandler: React.FC<EdgeCaseHandlerProps> = ({
  columns,
  rowCount,
  onColumnsFixed,
  autoFix = false,
}) => {
  const [analysis, setAnalysis] = useState<EdgeCaseAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [fixedColumns, setFixedColumns] = useState<DetectedColumn[] | null>(null);

  // Run analysis on mount and when columns/rowCount change
  useEffect(() => {
    setIsAnalyzing(true);

    // Simulate small delay for UX
    setTimeout(() => {
      const result = analyzeEdgeCases(columns, rowCount, true);
      setAnalysis(result);
      setIsAnalyzing(false);

      // Auto-fix if requested
      if (autoFix && (result.columnNameIssues.length > 0 || result.duplicateColumns.length > 0)) {
        handleAutoFix();
      }
    }, 100);
  }, [columns, rowCount, autoFix]);

  const handleAutoFix = () => {
    // Sanitize column names
    const { sanitized } = sanitizeAllColumnNames(columns);

    // Resolve duplicate column names
    const columnNames = sanitized.map((c) => c.columnName);
    const { resolvedNames } = resolveDuplicateColumnNames(columnNames);

    const fixed = sanitized.map((col, index) => ({
      ...col,
      columnName: resolvedNames[index],
    }));

    setFixedColumns(fixed);

    if (onColumnsFixed) {
      onColumnsFixed(fixed);
    }
  };

  if (isAnalyzing) {
    return (
      <Card loading size="small">
        <Text>Analyzing file for edge cases...</Text>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const hasCriticalIssues = analysis.criticalIssues.length > 0;
  const hasWarnings = analysis.warnings.length > 0;
  const hasRecommendations = analysis.recommendations.length > 0;

  // If no issues, show success message
  if (!hasCriticalIssues && !hasWarnings && !hasRecommendations) {
    return (
      <Alert
        type="success"
        icon={<CheckCircleOutlined />}
        message="No Edge Cases Detected"
        description="Your file is clean and ready for processing."
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          Edge Case Analysis
          {hasCriticalIssues && (
            <Tag color="error">{analysis.criticalIssues.length} Critical</Tag>
          )}
          {hasWarnings && !hasCriticalIssues && (
            <Tag color="warning">{analysis.warnings.length} Warnings</Tag>
          )}
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      {/* Critical Issues */}
      {hasCriticalIssues && (
        <>
          <Alert
            type="error"
            icon={<WarningOutlined />}
            message="Critical Issues Detected"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {analysis.criticalIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            }
            showIcon
            style={{ marginBottom: 16 }}
          />

          {(analysis.columnNameIssues.length > 0 || analysis.duplicateColumns.length > 0) && (
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleAutoFix}
                disabled={fixedColumns !== null}
              >
                {fixedColumns ? 'Fixed' : 'Auto-Fix Column Names'}
              </Button>
              {fixedColumns && (
                <Text type="success" style={{ marginLeft: 8 }}>
                  ✓ Column names have been automatically fixed
                </Text>
              )}
            </div>
          )}
        </>
      )}

      {/* Dataset Size Info */}
      <Collapse size="small" defaultActiveKey={analysis.datasetSize.isLarge ? ['size'] : []}>
        <Panel
          header={
            <Space>
              <DatabaseOutlined />
              Dataset Size Analysis
              {analysis.datasetSize.isVeryLarge && <Tag color="red">Very Large</Tag>}
              {analysis.datasetSize.isLarge && !analysis.datasetSize.isVeryLarge && (
                <Tag color="orange">Large</Tag>
              )}
            </Space>
          }
          key="size"
        >
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Rows">
              {analysis.datasetSize.rowCount.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Columns">
              {analysis.datasetSize.columnCount}
            </Descriptions.Item>
            <Descriptions.Item label="Est. Memory">
              {analysis.datasetSize.estimatedMemoryMB.toFixed(0)}MB
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {analysis.datasetSize.exceedsLimits ? (
                <Tag color="error">Exceeds Limits</Tag>
              ) : analysis.datasetSize.isVeryLarge ? (
                <Tag color="warning">Very Large</Tag>
              ) : analysis.datasetSize.isLarge ? (
                <Tag color="processing">Large</Tag>
              ) : (
                <Tag color="success">Normal</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>

          {analysis.datasetSize.warnings.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text strong>Warnings:</Text>
              <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                {analysis.datasetSize.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        {/* Column Name Issues */}
        {analysis.columnNameIssues.length > 0 && (
          <Panel
            header={
              <Space>
                <FileTextOutlined />
                Column Name Issues
                <Tag color="warning">{analysis.columnNameIssues.length}</Tag>
              </Space>
            }
            key="columns"
          >
            <Table
              dataSource={analysis.columnNameIssues}
              columns={[
                {
                  title: 'Original Name',
                  dataIndex: 'originalName',
                  key: 'originalName',
                  render: (text) => <Text code>{text}</Text>,
                },
                {
                  title: 'Issue',
                  dataIndex: 'issue',
                  key: 'issue',
                  render: (issue) => (
                    <Tag color="orange">
                      {issue.replace('_', ' ').toUpperCase()}
                    </Tag>
                  ),
                },
                {
                  title: 'Details',
                  dataIndex: 'details',
                  key: 'details',
                },
                {
                  title: 'Suggested Fix',
                  dataIndex: 'suggestedFix',
                  key: 'suggestedFix',
                  render: (text) => <Text code type="success">{text}</Text>,
                },
              ]}
              size="small"
              pagination={false}
              rowKey={(record) => record.originalName + record.issue}
            />
          </Panel>
        )}

        {/* Duplicate Columns */}
        {analysis.duplicateColumns.length > 0 && (
          <Panel
            header={
              <Space>
                <WarningOutlined />
                Duplicate Column Names
                <Tag color="error">{analysis.duplicateColumns.length}</Tag>
              </Space>
            }
            key="duplicates"
          >
            {analysis.duplicateColumns.map((dup, idx) => (
              <Card key={idx} size="small" type="inner" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Original: </Text>
                    <Text code>{dup.originalName}</Text>
                    <Tag color="error" style={{ marginLeft: 8 }}>
                      {dup.count} duplicates
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Resolved to: </Text>
                    {dup.resolvedNames.map((name, i) => (
                      <Tag key={i} color="success">
                        {name}
                      </Tag>
                    ))}
                  </div>
                </Space>
              </Card>
            ))}
          </Panel>
        )}

        {/* Encoding Issues */}
        {analysis.encodingIssues.length > 0 && (
          <Panel
            header={
              <Space>
                <BugOutlined />
                Encoding Issues
                <Tag color="error">{analysis.encodingIssues.length}</Tag>
              </Space>
            }
            key="encoding"
          >
            {analysis.encodingIssues.map((issue, idx) => (
              <Alert
                key={idx}
                type="error"
                message={issue.type.replace('_', ' ').toUpperCase()}
                description={
                  <div>
                    <Paragraph>{issue.details}</Paragraph>
                    <Text strong>Affected Columns: </Text>
                    {issue.affectedColumns.map((col, i) => (
                      <Tag key={i} color="red">
                        {col}
                      </Tag>
                    ))}
                    <Divider style={{ margin: '8px 0' }} />
                    <Text strong>Suggestion: </Text>
                    <Text type="secondary">{issue.suggestion}</Text>
                  </div>
                }
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))}
          </Panel>
        )}

        {/* Type Confusion */}
        {analysis.typeConfusions.length > 0 && (
          <Panel
            header={
              <Space>
                <InfoCircleOutlined />
                Type Confusion Detected
                <Tag color="warning">{analysis.typeConfusions.length}</Tag>
              </Space>
            }
            key="types"
          >
            {analysis.typeConfusions.map((tc, idx) => (
              <Card key={idx} size="small" type="inner" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Column: </Text>
                    <Text code>{tc.columnName}</Text>
                    <Tag color="orange" style={{ marginLeft: 8 }}>
                      {Math.round(tc.confidence * 100)}% confidence
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Detected Type: </Text>
                    <Tag>{tc.detectedType}</Tag>
                  </div>
                  <div>
                    <Text strong>Conflicting Types: </Text>
                    {tc.conflictingTypes.map((type, i) => (
                      <Tag key={i} color="warning">
                        {type}
                      </Tag>
                    ))}
                  </div>
                  <div>
                    <Text strong>Sample Values: </Text>
                    <Text code>{tc.sampleValues.join(', ')}</Text>
                  </div>
                  <Alert
                    type="warning"
                    message={tc.suggestion}
                    showIcon
                    size="small"
                  />
                </Space>
              </Card>
            ))}
          </Panel>
        )}

        {/* Memory Optimization */}
        {analysis.memoryOptimization && (
          <Panel
            header={
              <Space>
                <ThunderboltOutlined />
                Memory Optimization Applied
                <Tag color="success">
                  {analysis.memoryOptimization.reduction}% reduced
                </Tag>
              </Space>
            }
            key="memory"
          >
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Original Sample Size">
                {analysis.memoryOptimization.originalSampleSize.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Optimized Sample Size">
                {analysis.memoryOptimization.optimizedSampleSize.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Reduction">
                <Tag color="success">
                  {analysis.memoryOptimization.reduction}%
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Est. Savings">
                {analysis.memoryOptimization.estimatedSavingsMB.toFixed(1)}MB
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 12 }}>
              <Progress
                percent={100 - analysis.memoryOptimization.reduction}
                strokeColor="#52c41a"
                format={(percent) => `${100 - (percent || 0)}% reduced`}
              />
            </div>
          </Panel>
        )}
      </Collapse>

      {/* Recommendations */}
      {hasRecommendations && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type="info"
            icon={<InfoCircleOutlined />}
            message="Recommendations"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            }
            showIcon
          />
        </div>
      )}
    </Card>
  );
};
