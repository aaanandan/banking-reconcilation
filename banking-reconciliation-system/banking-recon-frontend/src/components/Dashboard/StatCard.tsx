import React from 'react';
import { Card, Statistic, Space, Tag } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { MetricTrend, getTrendColor } from '../../utils/dashboardUtils';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: MetricTrend;
  trendPercentage?: number;
  trendLabel?: string;
  color?: string;
  inverseTrend?: boolean; // true if down is good (e.g., unmatched count)
  onClick?: () => void;
}

/**
 * Dashboard statistic card with trend indicator
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendPercentage,
  trendLabel,
  color = '#1890ff',
  inverseTrend = false,
  onClick,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend) {
      case MetricTrend.UP:
        return <ArrowUpOutlined />;
      case MetricTrend.DOWN:
        return <ArrowDownOutlined />;
      case MetricTrend.STABLE:
        return <MinusOutlined />;
      default:
        return null;
    }
  };

  return (
    <Card
      size="small"
      hoverable={!!onClick}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color }}
      />
      {trend && trendPercentage !== undefined && (
        <Space style={{ marginTop: 8 }} size={4}>
          <Tag
            color={getTrendColor(trend, inverseTrend)}
            icon={getTrendIcon()}
            style={{ margin: 0 }}
          >
            {trendPercentage}%
          </Tag>
          {trendLabel && (
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{trendLabel}</span>
          )}
        </Space>
      )}
    </Card>
  );
};

export default StatCard;
