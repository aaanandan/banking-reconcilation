import React from 'react';
import { Card, Row, Col, Typography, Space } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { QuickAction, QUICK_ACTIONS } from '../../utils/dashboardUtils';

const { Text } = Typography;

interface QuickActionsProps {
  onActionClick: (route: string) => void;
  actions?: QuickAction[];
}

/**
 * Quick action buttons for common tasks
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick,
  actions = QUICK_ACTIONS,
}) => {
  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          <span>Quick Actions</span>
        </Space>
      }
      size="small"
    >
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col span={8} key={action.id}>
            <Card
              size="small"
              hoverable
              onClick={() => onActionClick(action.route)}
              style={{
                cursor: 'pointer',
                borderLeft: `4px solid ${action.color}`,
              }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div
                  style={{
                    fontSize: 24,
                    color: action.color,
                  }}
                >
                  {React.createElement(
                    require('@ant-design/icons')[action.icon]
                  )}
                </div>
                <Text strong style={{ fontSize: 14 }}>
                  {action.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {action.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActions;
