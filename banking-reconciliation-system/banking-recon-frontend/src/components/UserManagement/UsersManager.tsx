import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Statistic, Input, Select, Spin, Empty, message } from 'antd';
import {
  ReloadOutlined,
  UserAddOutlined,
  SearchOutlined,
  TeamOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { UserCard } from './UserCard';
import { UserFormModal } from './UserFormModal';
import { InviteUserModal } from './InviteUserModal';
import {
  User,
  UserRole,
  UserStatus,
  UserInvitation,
  UserFilter,
  calculateUserStats,
  filterUsers,
  sortUsers,
  getRoleLabel,
  getStatusLabel,
} from '../../utils/userManagementUtils';

const { Title, Text } = Typography;

interface UsersManagerProps {
  users: User[];
  loading?: boolean;
  onRefresh?: () => void;
  onInvite?: (invitation: UserInvitation) => Promise<void>;
  onUpdate?: (userId: string, user: Partial<User>) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
  onActivate?: (userId: string) => Promise<void>;
  onDeactivate?: (userId: string) => Promise<void>;
  onResendInvite?: (userId: string) => Promise<void>;
}

/**
 * Main user management component
 */
export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  loading = false,
  onRefresh,
  onInvite,
  onUpdate,
  onDelete,
  onActivate,
  onDeactivate,
  onResendInvite,
}) => {
  const [filter, setFilter] = useState<UserFilter>({});
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'status' | 'lastLogin' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const filtered = filterUsers(users, filter);
    return sortUsers(filtered, sortField, sortOrder);
  }, [users, filter, sortField, sortOrder]);

  const stats = useMemo(() => calculateUserStats(users), [users]);

  const uniqueDepartments = useMemo(() =>
    Array.from(new Set(users.map((u) => u.department).filter(Boolean) as string[])),
    [users]
  );

  const handleInvite = async (invitation: UserInvitation) => {
    if (!onInvite) return;

    setInviting(true);
    try {
      await onInvite(invitation);
      setInviteModalVisible(false);
      message.success('Invitation sent successfully');
    } catch (error) {
      message.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditModalVisible(true);
    }
  };

  const handleUpdate = async (userData: Partial<User>) => {
    if (!onUpdate || !selectedUser) return;

    setSaving(true);
    try {
      await onUpdate(selectedUser.id, userData);
      setEditModalVisible(false);
      setSelectedUser(null);
      message.success('User updated successfully');
    } catch (error) {
      message.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!onDelete) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await onDelete(userId);
        message.success('User deleted successfully');
      } catch (error) {
        message.error('Failed to delete user');
      }
    }
  };

  const handleActivate = async (userId: string) => {
    if (!onActivate) return;

    try {
      await onActivate(userId);
      message.success('User activated successfully');
    } catch (error) {
      message.error('Failed to activate user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!onDeactivate) return;

    const confirmed = window.confirm(
      'Are you sure you want to deactivate this user? They will no longer be able to access the system.'
    );

    if (confirmed) {
      try {
        await onDeactivate(userId);
        message.success('User deactivated successfully');
      } catch (error) {
        message.error('Failed to deactivate user');
      }
    }
  };

  const handleResendInvite = async (userId: string) => {
    if (!onResendInvite) return;

    try {
      await onResendInvite(userId);
      message.success('Invitation resent successfully');
    } catch (error) {
      message.error('Failed to resend invitation');
    }
  };

  return (
    <div>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              User Management
            </Title>
          </Col>
          <Col>
            <Space>
              {onRefresh && (
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                  Refresh
                </Button>
              )}
              {onInvite && (
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setInviteModalVisible(true)}
                >
                  Invite User
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Users" value={stats.total} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Active" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Pending" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Inactive" value={stats.inactive + stats.suspended} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
      </Row>

      {/* Role Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.entries(stats.byRole).map(([role, count]) => (
          <Col span={6} key={role}>
            <Card size="small">
              <Statistic
                title={getRoleLabel(role as UserRole)}
                value={count}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters & Search */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%' }} wrap>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            allowClear
          />

          <Select
            mode="multiple"
            placeholder="Filter by role"
            style={{ width: 200 }}
            value={filter.role}
            onChange={(role) => setFilter({ ...filter, role })}
            options={Object.values(UserRole).map((role) => ({
              label: getRoleLabel(role),
              value: role,
            }))}
            allowClear
          />

          <Select
            mode="multiple"
            placeholder="Filter by status"
            style={{ width: 200 }}
            value={filter.status}
            onChange={(status) => setFilter({ ...filter, status })}
            options={Object.values(UserStatus).map((status) => ({
              label: getStatusLabel(status),
              value: status,
            }))}
            allowClear
          />

          <Select
            mode="multiple"
            placeholder="Filter by department"
            style={{ width: 200 }}
            value={filter.department}
            onChange={(department) => setFilter({ ...filter, department })}
            options={uniqueDepartments.map((dept) => ({
              label: dept,
              value: dept,
            }))}
            allowClear
          />

          <Text type="secondary">Sort:</Text>
          <Select
            value={sortField}
            onChange={setSortField}
            style={{ width: 150 }}
            options={[
              { label: 'Name', value: 'name' },
              { label: 'Email', value: 'email' },
              { label: 'Role', value: 'role' },
              { label: 'Status', value: 'status' },
              { label: 'Last Login', value: 'lastLogin' },
              { label: 'Created At', value: 'createdAt' },
            ]}
          />

          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </Space>
      </Card>

      {/* Users List */}
      <Card
        title={`Users (${filteredAndSorted.length})`}
        size="small"
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Loading users..." />
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <Empty description="No users found" />
        ) : (
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {filteredAndSorted.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  onResendInvite={handleResendInvite}
                />
              ))}
            </Space>
          </div>
        )}
      </Card>

      {/* Modals */}
      <InviteUserModal
        visible={inviteModalVisible}
        onInvite={handleInvite}
        onCancel={() => setInviteModalVisible(false)}
        inviting={inviting}
      />

      <UserFormModal
        visible={editModalVisible}
        user={selectedUser}
        onSave={handleUpdate}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
        }}
        saving={saving}
      />
    </div>
  );
};

export default UsersManager;
