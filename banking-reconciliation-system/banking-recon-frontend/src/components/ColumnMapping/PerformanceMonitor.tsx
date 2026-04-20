import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Tag, Progress, Typography, Space, Divider } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { usePerformanceMetrics } from '../../hooks/usePerformance';
import { getValidationCacheStats, validationScheduler } from '../../utils/lazyValidation';

const { Text } = Typography;

interface PerformanceMonitorProps {
  componentName?: string;
  showCacheStats?: boolean;
  showSchedulerStats?: boolean;
}

/**
 * Development component to monitor performance metrics
 * Only shown in development mode
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName = 'ColumnMapping',
  showCacheStats = true,
  showSchedulerStats = true,
}) => {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const metrics = usePerformanceMetrics(componentName);
  const [cacheStats, setCacheStats] = useState(getValidationCacheStats());
  const [schedulerStats, setSchedulerStats] = useState(validationScheduler.getStatus());

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (showCacheStats) {
        setCacheStats(getValidationCacheStats());
      }
      if (showSchedulerStats) {
        setSchedulerStats(validationScheduler.getStatus());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showCacheStats, showSchedulerStats]);

  const getRenderTimeColor = (time: number): string => {
    if (time < 16) return 'success'; // 60 FPS
    if (time < 33) return 'warning'; // 30 FPS
    return 'danger'; // < 30 FPS
  };

  const getRenderTimePercent = (time: number): number => {
    // 16ms = 100% (60 FPS target)
    return Math.min((time / 16) * 100, 100);
  };

  const getCacheEfficiency = (stats: any): number => {
    if (stats.maxSize === 0) return 0;
    return (stats.size / stats.maxSize) * 100;
  };

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          Performance Monitor
          <Tag color="blue">DEV ONLY</Tag>
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      {/* Render Metrics */}
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="Render Count"
            value={metrics.renderCount}
            prefix={<RocketOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Last Render"
            value={metrics.lastRenderTime.toFixed(2)}
            suffix="ms"
            prefix={<ClockCircleOutlined />}
            valueStyle={{
              color:
                getRenderTimeColor(metrics.lastRenderTime) === 'success'
                  ? '#3f8600'
                  : getRenderTimeColor(metrics.lastRenderTime) === 'warning'
                  ? '#cf1322'
                  : '#faad14',
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Avg Render"
            value={metrics.averageRenderTime.toFixed(2)}
            suffix="ms"
            valueStyle={{
              color:
                getRenderTimeColor(metrics.averageRenderTime) === 'success'
                  ? '#3f8600'
                  : getRenderTimeColor(metrics.averageRenderTime) === 'warning'
                  ? '#faad14'
                  : '#cf1322',
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Max Render"
            value={metrics.maxRenderTime.toFixed(2)}
            suffix="ms"
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* Render Performance Bar */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Frame Budget (60 FPS = 16ms target)</Text>
        <Progress
          percent={getRenderTimePercent(metrics.lastRenderTime)}
          status={
            getRenderTimeColor(metrics.lastRenderTime) === 'success'
              ? 'success'
              : getRenderTimeColor(metrics.lastRenderTime) === 'warning'
              ? 'active'
              : 'exception'
          }
          strokeColor={
            getRenderTimeColor(metrics.lastRenderTime) === 'success'
              ? '#52c41a'
              : getRenderTimeColor(metrics.lastRenderTime) === 'warning'
              ? '#faad14'
              : '#f5222d'
          }
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {metrics.lastRenderTime < 16
            ? '✓ Smooth (60+ FPS)'
            : metrics.lastRenderTime < 33
            ? '⚠ Acceptable (30-60 FPS)'
            : '✗ Slow (<30 FPS)'}
        </Text>
      </div>

      {/* Cache Statistics */}
      {showCacheStats && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Text strong>
            <DatabaseOutlined /> Validation Cache Stats
          </Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={8}>
              <Card size="small" type="inner">
                <Statistic
                  title="Basic Validation"
                  value={cacheStats.basicValidation.size}
                  suffix={`/ ${cacheStats.basicValidation.maxSize}`}
                  valueStyle={{ fontSize: 16 }}
                />
                <Progress
                  percent={getCacheEfficiency(cacheStats.basicValidation)}
                  size="small"
                  showInfo={false}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" type="inner">
                <Statistic
                  title="Quality Cache"
                  value={cacheStats.quality.size}
                  suffix={`/ ${cacheStats.quality.maxSize}`}
                  valueStyle={{ fontSize: 16 }}
                />
                <Progress
                  percent={getCacheEfficiency(cacheStats.quality)}
                  size="small"
                  showInfo={false}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" type="inner">
                <Statistic
                  title="Advanced Validation"
                  value={cacheStats.advancedValidation.size}
                  suffix={`/ ${cacheStats.advancedValidation.maxSize}`}
                  valueStyle={{ fontSize: 16 }}
                />
                <Progress
                  percent={getCacheEfficiency(cacheStats.advancedValidation)}
                  size="small"
                  showInfo={false}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Scheduler Statistics */}
      {showSchedulerStats && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Text strong>Validation Scheduler</Text>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={8}>
              <Statistic
                title="Queue Length"
                value={schedulerStats.queueLength}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Status"
                value={schedulerStats.isProcessing ? 'Processing' : 'Idle'}
                valueStyle={{
                  fontSize: 16,
                  color: schedulerStats.isProcessing ? '#1890ff' : '#52c41a',
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Current Task"
                value={schedulerStats.currentTaskId || 'None'}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
          </Row>
        </>
      )}

      <Divider style={{ margin: '16px 0' }} />

      <Text type="secondary" style={{ fontSize: 12 }}>
        Performance metrics are collected only in development mode and do not affect
        production builds.
      </Text>
    </Card>
  );
};
