import React from 'react';
import { Modal, Tabs, Descriptions, Tag, Progress, Space, Typography, Empty, List } from 'antd';
import {
  IdcardOutlined,
  LineChartOutlined,
  BankOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import {
  EntityProfile,
  getConfidenceColor,
  getFrequencyPatternLabel,
  formatAmountRange,
  formatSeasonality,
  calculateMatchRate,
  getFieldReliabilityLabel,
  getFieldReliabilityColor,
  getTopReliableFields,
} from '../../utils/entityProfileUtils';

const { TabPane } = Tabs;
const { Text } = Typography;

interface EntityProfileDetailProps {
  visible: boolean;
  profile: EntityProfile | null;
  onClose: () => void;
}

/**
 * Detailed view of entity profile with tabs
 */
export const EntityProfileDetail: React.FC<EntityProfileDetailProps> = ({
  visible,
  profile,
  onClose,
}) => {
  if (!profile) return null;

  const matchRate = calculateMatchRate(profile);
  const topFields = getTopReliableFields(profile.fieldReliabilityScores, 5);

  return (
    <Modal
      title={
        <Space>
          <IdcardOutlined />
          <span>{profile.primaryName}</span>
          <Tag color={getConfidenceColor(profile.confidence)}>
            {(profile.confidence * 100).toFixed(0)}% Confidence
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <Tabs defaultActiveKey="identity">
        {/* Identity Tab */}
        <TabPane tab={<span><IdcardOutlined /> Identity</span>} key="identity">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Entity ID">{profile.entityId}</Descriptions.Item>
            <Descriptions.Item label="Primary Name">{profile.primaryName}</Descriptions.Item>
            <Descriptions.Item label="Legal Name">
              {profile.legalName || 'Not specified'}
            </Descriptions.Item>
            <Descriptions.Item label="Industry">
              {profile.industry || 'Not specified'}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {profile.location || 'Not specified'}
            </Descriptions.Item>
            <Descriptions.Item label="Aliases" span={2}>
              {profile.aliases.length > 0 ? (
                <Space size={4} wrap>
                  {profile.aliases.map((alias, idx) => (
                    <Tag key={idx}>{alias}</Tag>
                  ))}
                </Space>
              ) : (
                'No aliases'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tags" span={2}>
              {profile.tags.length > 0 ? (
                <Space size={4} wrap>
                  {profile.tags.map((tag, idx) => (
                    <Tag key={idx} color="blue">{tag}</Tag>
                  ))}
                </Space>
              ) : (
                'No tags'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Parent Company">
              {profile.parentCompany || 'None'}
            </Descriptions.Item>
            <Descriptions.Item label="Subsidiaries">
              {profile.subsidiaries.length > 0 ? profile.subsidiaries.join(', ') : 'None'}
            </Descriptions.Item>
            <Descriptions.Item label="Related Entities" span={2}>
              {profile.relatedEntities.length > 0 ? profile.relatedEntities.join(', ') : 'None'}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        {/* Business Patterns Tab */}
        <TabPane tab={<span><LineChartOutlined /> Patterns</span>} key="patterns">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Amount Range" span={2}>
              {formatAmountRange(profile)}
            </Descriptions.Item>
            <Descriptions.Item label="Frequency Pattern">
              {profile.frequencyPattern ? (
                <Tag color="blue">{getFrequencyPatternLabel(profile.frequencyPattern)}</Tag>
              ) : (
                'Unknown'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Preferred Day">
              {profile.preferredDayOfMonth ? `Day ${profile.preferredDayOfMonth}` : 'No preference'}
            </Descriptions.Item>
            <Descriptions.Item label="Seasonality" span={2}>
              {formatSeasonality(profile.seasonality)}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        {/* Bank Behavior Tab */}
        <TabPane tab={<span><BankOutlined /> Bank Behavior</span>} key="banks">
          {profile.bankSpecificBehavior && Object.keys(profile.bankSpecificBehavior).length > 0 ? (
            <List
              dataSource={Object.entries(profile.bankSpecificBehavior)}
              renderItem={([bankId, behavior]) => (
                <List.Item>
                  <Descriptions column={1} bordered size="small" style={{ width: '100%' }}>
                    <Descriptions.Item label="Bank ID">{bankId}</Descriptions.Item>
                    <Descriptions.Item label="Date Offset">
                      {behavior.dateOffset} days
                    </Descriptions.Item>
                    <Descriptions.Item label="Most Reliable Field">
                      {behavior.mostReliableField}
                    </Descriptions.Item>
                    {behavior.refNumberFormat && (
                      <Descriptions.Item label="Reference Format">
                        {behavior.refNumberFormat}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No bank-specific behavior data" />
          )}
        </TabPane>

        {/* Statistics Tab */}
        <TabPane tab={<span><BarChartOutlined /> Statistics</span>} key="stats">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Total Transactions">
              {profile.totalTransactions}
            </Descriptions.Item>
            <Descriptions.Item label="Successful Matches">
              {profile.successfulMatches}
            </Descriptions.Item>
            <Descriptions.Item label="Manual Interventions">
              {profile.manualInterventions}
            </Descriptions.Item>
            <Descriptions.Item label="Match Rate">
              <Progress
                percent={matchRate}
                size="small"
                strokeColor="#52c41a"
                style={{ width: 150 }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Override Rate">
              <Progress
                percent={profile.userOverrideRate * 100}
                size="small"
                strokeColor="#faad14"
                style={{ width: 150 }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Confidence">
              <Progress
                percent={profile.confidence * 100}
                size="small"
                strokeColor={getConfidenceColor(profile.confidence)}
                style={{ width: 150 }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Most Reliable Field" span={2}>
              {profile.mostReliableField || 'Not determined'}
            </Descriptions.Item>
            <Descriptions.Item label="Field Reliability Scores" span={2}>
              {topFields.length > 0 ? (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {topFields.map(({ field, score }) => (
                    <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{field}:</Text>
                      <Space>
                        <Progress
                          percent={score * 100}
                          size="small"
                          strokeColor={getFieldReliabilityColor(score)}
                          style={{ width: 100 }}
                        />
                        <Tag color={getFieldReliabilityColor(score)}>
                          {getFieldReliabilityLabel(score)}
                        </Tag>
                      </Space>
                    </div>
                  ))}
                </Space>
              ) : (
                'No reliability scores'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(profile.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(profile.lastUpdated).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default EntityProfileDetail;
