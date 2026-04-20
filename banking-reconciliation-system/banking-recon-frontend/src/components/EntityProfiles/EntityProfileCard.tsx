import React from 'react';
import { Card, Tag, Space, Typography, Progress, Row, Col, Tooltip, Badge } from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  TrophyOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  EntityProfile,
  getConfidenceColor,
  getConfidenceLabel,
  calculateMatchRate,
  getFrequencyPatternLabel,
  getFrequencyPatternColor,
  formatAmountRange,
  getBankCount,
  getCompletenessPercentage,
} from '../../utils/entityProfileUtils';

const { Text, Title } = Typography;

interface EntityProfileCardProps {
  profile: EntityProfile;
  onViewDetails?: (profileId: string) => void;
  selected?: boolean;
  onSelect?: (profileId: string, selected: boolean) => void;
  compact?: boolean;
}

/**
 * Card displaying an entity profile summary
 */
export const EntityProfileCard: React.FC<EntityProfileCardProps> = ({
  profile,
  onViewDetails,
  selected = false,
  onSelect,
  compact = false,
}) => {
  const matchRate = calculateMatchRate(profile);
  const bankCount = getBankCount(profile);
  const completeness = getCompletenessPercentage(profile);
  const confidenceColor = getConfidenceColor(profile.confidence);

  return (
    <Card
      size="small"
      style={{
        border: selected ? '2px solid #1890ff' : `1px solid ${confidenceColor}`,
        borderLeft: `4px solid ${confidenceColor}`,
        backgroundColor: selected ? '#f0f7ff' : '#fff',
        marginBottom: compact ? 8 : 12,
        cursor: onViewDetails ? 'pointer' : 'default',
      }}
      bodyStyle={{ padding: compact ? 12 : 16 }}
      onClick={() => onViewDetails && onViewDetails(profile.id)}
      hoverable={!!onViewDetails}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="small" align="start">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelect(profile.id, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: 'pointer', marginTop: 4 }}
                />
              )}
              <div>
                <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                  {profile.primaryName}
                </Title>
                {profile.legalName && profile.legalName !== profile.primaryName && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Legal: {profile.legalName}
                  </Text>
                )}
              </div>
            </Space>
          </Col>
          <Col>
            <Tooltip title={getConfidenceLabel(profile.confidence)}>
              <Tag color={confidenceColor} style={{ fontWeight: 'bold' }}>
                {(profile.confidence * 100).toFixed(0)}%
              </Tag>
            </Tooltip>
          </Col>
        </Row>
      </div>

      {/* Aliases */}
      {!compact && profile.aliases.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
            Also known as:
          </Text>
          <Space size={4} wrap>
            {profile.aliases.slice(0, 5).map((alias, idx) => (
              <Tag key={idx} style={{ fontSize: 11 }}>
                {alias}
              </Tag>
            ))}
            {profile.aliases.length > 5 && (
              <Tag style={{ fontSize: 11 }}>+{profile.aliases.length - 5} more</Tag>
            )}
          </Space>
        </div>
      )}

      {/* Metadata */}
      <div style={{ marginBottom: 12 }}>
        <Space size={16} wrap>
          {profile.industry && (
            <Tooltip title="Industry">
              <Tag icon={<BankOutlined />} color="blue">
                {profile.industry}
              </Tag>
            </Tooltip>
          )}
          {profile.location && (
            <Tooltip title="Location">
              <Tag color="cyan">{profile.location}</Tag>
            </Tooltip>
          )}
          {profile.frequencyPattern && (
            <Tooltip title="Payment Frequency">
              <Tag icon={<CalendarOutlined />} color={getFrequencyPatternColor(profile.frequencyPattern)}>
                {getFrequencyPatternLabel(profile.frequencyPattern)}
              </Tag>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* Statistics Grid */}
      <Row gutter={8} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
              Transactions
            </Text>
            <Text strong style={{ fontSize: 14 }}>
              {profile.totalTransactions}
            </Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
              Match Rate
            </Text>
            <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
              {matchRate.toFixed(0)}%
            </Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
              Override %
            </Text>
            <Text strong style={{ fontSize: 14, color: '#faad14' }}>
              {(profile.userOverrideRate * 100).toFixed(0)}%
            </Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center', padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
              Banks
            </Text>
            <Text strong style={{ fontSize: 14 }}>
              {bankCount}
            </Text>
          </div>
        </Col>
      </Row>

      {/* Business Patterns */}
      {!compact && (
        <div style={{ marginBottom: 12 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <DollarOutlined /> Amount Range:
              </Text>
              <Text style={{ fontSize: 11 }}>{formatAmountRange(profile)}</Text>
            </div>
            {profile.preferredDayOfMonth && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <CalendarOutlined /> Preferred Day:
                </Text>
                <Text style={{ fontSize: 11 }}>Day {profile.preferredDayOfMonth}</Text>
              </div>
            )}
            {profile.mostReliableField && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <CheckCircleOutlined /> Best Field:
                </Text>
                <Text style={{ fontSize: 11 }}>{profile.mostReliableField}</Text>
              </div>
            )}
          </Space>
        </div>
      )}

      {/* Relationships */}
      {!compact && (profile.parentCompany || profile.subsidiaries.length > 0 || profile.relatedEntities.length > 0) && (
        <div style={{ marginBottom: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Space size={4} wrap>
            {profile.parentCompany && (
              <Tooltip title={`Parent: ${profile.parentCompany}`}>
                <Tag icon={<TeamOutlined />} color="purple" style={{ fontSize: 11 }}>
                  Parent
                </Tag>
              </Tooltip>
            )}
            {profile.subsidiaries.length > 0 && (
              <Tooltip title={`${profile.subsidiaries.length} Subsidiaries`}>
                <Tag icon={<TeamOutlined />} color="geekblue" style={{ fontSize: 11 }}>
                  {profile.subsidiaries.length} Subs
                </Tag>
              </Tooltip>
            )}
            {profile.relatedEntities.length > 0 && (
              <Tooltip title={`${profile.relatedEntities.length} Related Entities`}>
                <Tag color="cyan" style={{ fontSize: 11 }}>
                  {profile.relatedEntities.length} Related
                </Tag>
              </Tooltip>
            )}
          </Space>
        </div>
      )}

      {/* Profile Completeness */}
      {!compact && (
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Profile Completeness:
            </Text>
            <Text strong style={{ fontSize: 11 }}>
              {completeness.toFixed(0)}%
            </Text>
          </div>
          <Progress
            percent={completeness}
            size="small"
            strokeColor={
              completeness >= 80 ? '#52c41a' : completeness >= 50 ? '#faad14' : '#ff4d4f'
            }
            showInfo={false}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Updated: {new Date(profile.lastUpdated).toLocaleDateString()}
            </Text>
          </Col>
          {onViewDetails && (
            <Col>
              <a
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(profile.id);
                }}
                style={{ fontSize: 12 }}
              >
                View Details →
              </a>
            </Col>
          )}
        </Row>
      </div>
    </Card>
  );
};

export default EntityProfileCard;
