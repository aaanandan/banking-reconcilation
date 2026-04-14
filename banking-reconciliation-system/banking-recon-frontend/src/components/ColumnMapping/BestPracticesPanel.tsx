import React, { useState } from 'react';
import {
  Card,
  Collapse,
  Alert,
  Tag,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  Tooltip,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  BEST_PRACTICES,
  COMMON_MISTAKES,
  detectMistakes,
  getContextualTips,
  getRandomQuickStartTip,
  BestPractice,
  CommonMistake,
  DetectedMistake,
} from '../../utils/mappingGuidance';
import { DetectedColumn, ColumnMapping } from '../../services/dataPrepService';

const { Panel } = Collapse;
const { Text, Paragraph, Title } = Typography;

interface BestPracticesPanelProps {
  detectedColumns: DetectedColumn[];
  mappings: ColumnMapping[];
  validationScore?: number;
}

/**
 * Component to display best practices, common mistakes, and contextual tips
 */
export const BestPracticesPanel: React.FC<BestPracticesPanelProps> = ({
  detectedColumns,
  mappings,
  validationScore,
}) => {
  const [detectedMistakesState] = useState<DetectedMistake[]>(
    detectMistakes(detectedColumns, mappings)
  );
  const [contextualTips] = useState(
    getContextualTips(detectedColumns, mappings, validationScore)
  );

  const getImportanceColor = (importance: BestPractice['importance']): string => {
    switch (importance) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: CommonMistake['severity']) => {
    switch (severity) {
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getSeverityColor = (severity: CommonMistake['severity']): string => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card title={<><BulbOutlined /> Mapping Guidance</>} size="small">
      {/* Quick Start Tip */}
      <Alert
        type="info"
        icon={<ThunderboltOutlined />}
        message="Quick Tip"
        description={getRandomQuickStartTip()}
        style={{ marginBottom: 16 }}
        closable
      />

      {/* Contextual Tips */}
      {contextualTips.length > 0 && (
        <>
          {contextualTips.map((tip) => (
            <Alert
              key={tip.id}
              type={tip.type}
              message={tip.message}
              style={{ marginBottom: 16 }}
              closable
              action={
                tip.action ? (
                  <a onClick={() => console.log(tip.action?.handler)}>
                    {tip.action.label}
                  </a>
                ) : undefined
              }
            />
          ))}
        </>
      )}

      {/* Detected Mistakes */}
      {detectedMistakesState.length > 0 && (
        <>
          <Title level={5}>
            <WarningOutlined style={{ color: '#faad14' }} /> Detected Issues
          </Title>
          <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
            {detectedMistakesState.map((detected, index) => (
              <Card key={index} size="small" type="inner">
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    {getSeverityIcon(detected.mistake.severity)}
                    <Text strong>{detected.mistake.title}</Text>
                    <Tag color={getSeverityColor(detected.mistake.severity)}>
                      {detected.mistake.severity.toUpperCase()}
                    </Tag>
                  </Space>
                  <Text type="secondary">{detected.context}</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text strong style={{ fontSize: 12 }}>
                    How to fix:
                  </Text>
                  <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
                    {detected.mistake.howToFix.map((fix, idx) => (
                      <li key={idx}>{fix}</li>
                    ))}
                  </ul>
                </Space>
              </Card>
            ))}
          </Space>
          <Divider />
        </>
      )}

      {/* Best Practices Collapsible */}
      <Title level={5}>
        <CheckCircleOutlined style={{ color: '#52c41a' }} /> Best Practices
      </Title>
      <Collapse size="small" style={{ marginBottom: 16 }}>
        {/* High Importance */}
        <Panel
          header={
            <Space>
              <Badge count="High Priority" style={{ backgroundColor: '#f5222d' }} />
              High Priority Best Practices
            </Space>
          }
          key="high"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {BEST_PRACTICES.filter((bp) => bp.importance === 'high').map((bp) => (
              <BestPracticeCard key={bp.id} practice={bp} />
            ))}
          </Space>
        </Panel>

        {/* Medium Importance */}
        <Panel
          header={
            <Space>
              <Badge count="Recommended" style={{ backgroundColor: '#faad14' }} />
              Recommended Practices
            </Space>
          }
          key="medium"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {BEST_PRACTICES.filter((bp) => bp.importance === 'medium').map((bp) => (
              <BestPracticeCard key={bp.id} practice={bp} />
            ))}
          </Space>
        </Panel>

        {/* Low Importance */}
        <Panel
          header={
            <Space>
              <Badge count="Optional" style={{ backgroundColor: '#1890ff' }} />
              Optional Enhancements
            </Space>
          }
          key="low"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {BEST_PRACTICES.filter((bp) => bp.importance === 'low').map((bp) => (
              <BestPracticeCard key={bp.id} practice={bp} />
            ))}
          </Space>
        </Panel>
      </Collapse>

      {/* Common Mistakes Reference */}
      <Title level={5}>
        <InfoCircleOutlined /> Common Mistakes to Avoid
      </Title>
      <Collapse size="small">
        {COMMON_MISTAKES.map((mistake) => (
          <Panel
            header={
              <Space>
                {getSeverityIcon(mistake.severity)}
                {mistake.title}
                <Tag color={getSeverityColor(mistake.severity)}>
                  {mistake.severity}
                </Tag>
              </Space>
            }
            key={mistake.id}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Paragraph>{mistake.description}</Paragraph>
              <Text strong>How to fix:</Text>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {mistake.howToFix.map((fix, idx) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </Space>
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const BestPracticeCard: React.FC<{ practice: BestPractice }> = ({ practice }) => {
  const getImportanceColor = (importance: BestPractice['importance']): string => {
    switch (importance) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <Card size="small" type="inner">
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Row justify="space-between">
          <Col>
            <Text strong>{practice.title}</Text>
          </Col>
          <Col>
            <Tag color={getImportanceColor(practice.importance)}>
              {practice.importance.toUpperCase()}
            </Tag>
          </Col>
        </Row>

        <Paragraph type="secondary" style={{ margin: 0 }}>
          {practice.description}
        </Paragraph>

        <Divider style={{ margin: '8px 0' }} />

        <Text strong style={{ fontSize: 12 }}>
          Tips:
        </Text>
        <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
          {practice.tips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>

        {practice.examples && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <Row gutter={8}>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
                      ✓ Good Example
                    </Text>
                    <Text style={{ fontSize: 12 }}>{practice.examples.good}</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e' }}>
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#f5222d', fontSize: 12 }}>
                      ✗ Bad Example
                    </Text>
                    <Text style={{ fontSize: 12 }}>{practice.examples.bad}</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </Card>
  );
};
