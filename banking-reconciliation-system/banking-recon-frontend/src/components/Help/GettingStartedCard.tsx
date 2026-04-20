import React from 'react';
import { Card, Space, Tag, Typography, Progress, Checkbox, List } from 'antd';
import { RocketOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  GettingStartedGuide,
  getDifficultyLabel,
  getDifficultyColor,
  getGuideProgress,
} from '../../utils/helpUtils';

const { Text, Title } = Typography;

interface GettingStartedCardProps {
  guide: GettingStartedGuide;
  onStepToggle?: (guideId: string, stepId: string, completed: boolean) => void;
}

/**
 * Getting started guide card with progress tracking
 */
export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  guide,
  onStepToggle,
}) => {
  const progress = getGuideProgress(guide);
  const completedSteps = guide.steps.filter((step) => step.completed).length;

  return (
    <Card
      size="small"
      title={
        <Space>
          <RocketOutlined style={{ color: '#1890ff' }} />
          <span>{guide.title}</span>
        </Space>
      }
      extra={
        <Space>
          <Tag color={getDifficultyColor(guide.difficulty)}>
            {getDifficultyLabel(guide.difficulty)}
          </Tag>
          <Space size={4}>
            <ClockCircleOutlined />
            <Text type="secondary">{guide.estimatedTime} min</Text>
          </Space>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Description */}
        <Text type="secondary">{guide.description}</Text>

        {/* Progress */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>
                Progress: {completedSteps}/{guide.steps.length} steps
              </Text>
              <Text strong style={{ color: progress === 100 ? '#52c41a' : '#1890ff' }}>
                {progress}%
              </Text>
            </Space>
          </div>
          <Progress
            percent={progress}
            strokeColor={progress === 100 ? '#52c41a' : '#1890ff'}
            showInfo={false}
          />
        </div>

        {/* Steps */}
        <List
          dataSource={guide.steps}
          renderItem={(step) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <Space align="start" style={{ width: '100%' }}>
                <Checkbox
                  checked={step.completed}
                  onChange={(e) => {
                    if (onStepToggle) {
                      onStepToggle(guide.id, step.id, e.target.checked);
                    }
                  }}
                  style={{ marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div>
                    <Text
                      strong
                      style={{
                        textDecoration: step.completed ? 'line-through' : 'none',
                        color: step.completed ? '#8c8c8c' : 'inherit',
                      }}
                    >
                      {step.order}. {step.title}
                    </Text>
                    {step.completed && (
                      <CheckCircleOutlined
                        style={{ color: '#52c41a', marginLeft: 8 }}
                      />
                    )}
                  </div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: 'block',
                      marginTop: 4,
                      textDecoration: step.completed ? 'line-through' : 'none',
                    }}
                  >
                    {step.description}
                  </Text>
                </div>
              </Space>
            </List.Item>
          )}
        />

        {/* Completion Message */}
        {progress === 100 && (
          <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <Text strong style={{ color: '#52c41a' }}>
                  Congratulations!
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  You've completed this guide. Great job!
                </Text>
              </div>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default GettingStartedCard;
