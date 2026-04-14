import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Statistic, Select, Spin, Empty } from 'antd';
import { ReloadOutlined, IdcardOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { EntityProfileCard } from './EntityProfileCard';
import { EntityProfileDetail } from './EntityProfileDetail';
import { EntityProfileFilters } from './EntityProfileFilters';
import {
  EntityProfile,
  EntityProfileFilter,
  calculateProfileStats,
  filterEntityProfiles,
  sortEntityProfiles,
} from '../../utils/entityProfileUtils';

const { Title } = Typography;

interface EntityProfilesManagerProps {
  profiles: EntityProfile[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const EntityProfilesManager: React.FC<EntityProfilesManagerProps> = ({
  profiles,
  loading = false,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<EntityProfileFilter>({});
  const [sortField, setSortField] = useState<'name' | 'confidence' | 'transactions' | 'matchRate' | 'lastUpdated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProfile, setSelectedProfile] = useState<EntityProfile | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const filtered = filterEntityProfiles(profiles, filter);
    return sortEntityProfiles(filtered, sortField, sortOrder);
  }, [profiles, filter, sortField, sortOrder]);

  const stats = useMemo(() => calculateProfileStats(filteredAndSorted), [filteredAndSorted]);

  const uniqueIndustries = useMemo(() =>
    Array.from(new Set(profiles.map(p => p.industry).filter(Boolean) as string[])),
    [profiles]
  );

  const uniqueLocations = useMemo(() =>
    Array.from(new Set(profiles.map(p => p.location).filter(Boolean) as string[])),
    [profiles]
  );

  const uniqueTags = useMemo(() =>
    Array.from(new Set(profiles.flatMap(p => p.tags))),
    [profiles]
  );

  const handleViewDetails = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
      setDetailVisible(true);
    }
  };

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <IdcardOutlined style={{ marginRight: 8 }} />
              Entity Profiles
            </Title>
          </Col>
          <Col>
            {onRefresh && (
              <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                Refresh
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Profiles" value={stats.total} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Avg Confidence" value={stats.avgConfidence} precision={2} suffix="%" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Avg Match Rate" value={stats.avgMatchRate} precision={1} suffix="%" valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Avg Transactions" value={stats.avgTransactions} precision={0} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <EntityProfileFilters
            onFilterChange={setFilter}
            initialFilter={filter}
            industries={uniqueIndustries}
            locations={uniqueLocations}
            tags={uniqueTags}
          />
        </Col>

        <Col span={18}>
          <Card
            size="small"
            title={`Profiles (${filteredAndSorted.length})`}
            extra={
              <Space>
                <span style={{ fontSize: 12 }}>Sort:</span>
                <Select
                  size="small"
                  value={sortField}
                  onChange={setSortField}
                  style={{ width: 150 }}
                  options={[
                    { label: 'Name', value: 'name' },
                    { label: 'Confidence', value: 'confidence' },
                    { label: 'Transactions', value: 'transactions' },
                    { label: 'Match Rate', value: 'matchRate' },
                    { label: 'Last Updated', value: 'lastUpdated' },
                  ]}
                />
                <Button
                  size="small"
                  icon={<SortAscendingOutlined />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </Space>
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" tip="Loading profiles..." />
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <Empty description="No profiles found" />
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {filteredAndSorted.map(profile => (
                    <EntityProfileCard
                      key={profile.id}
                      profile={profile}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <EntityProfileDetail
        visible={detailVisible}
        profile={selectedProfile}
        onClose={() => {
          setDetailVisible(false);
          setSelectedProfile(null);
        }}
      />
    </div>
  );
};

export default EntityProfilesManager;
