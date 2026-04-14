import React from 'react';
import { Card, Timeline, Typography, Empty, Space, Avatar } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import {
  ActivityItem,
  getActivityTypeIcon,
  getActivityTypeColor,
  formatRelativeTime,
} from '../../utils/dashboardUtils';

const { Text } = Typography;

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
}

/**
 * Recent activity timeline
 */
export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading = false,
  maxItems = 10,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Recent Activity</span>
        </Space>
      }
      size="small"
      loading={loading}
    >
      {displayActivities.length === 0 ? (
        <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline>
          {displayActivities.map((activity) => (
            <Timeline.Item
              key={activity.id}
              dot={
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: getActivityTypeColor(activity.type),
                  }}
                  icon={
                    React.createElement(
                      require('@ant-design/icons')[getActivityTypeIcon(activity.type)]
                    )
                  }
                />
              }
            >
              <Space direction="vertical" size={2}>
                <Text strong>{activity.title}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {activity.description}
                </Text>
                <Space size={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    by {activity.user}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    • {formatRelativeTime(activity.timestamp)}
                  </Text>
                </Space>
              </Space>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </Card>
  );
};

export default RecentActivity;
