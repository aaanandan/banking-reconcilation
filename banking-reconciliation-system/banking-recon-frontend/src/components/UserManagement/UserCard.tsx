import React from 'react';
import { Card, Space, Tag, Avatar, Typography, Button, Dropdown, Tooltip } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  User,
  UserStatus,
  getUserFullName,
  getUserInitials,
  getRoleLabel,
  getRoleColor,
  getStatusLabel,
  getStatusColor,
  formatLastLogin,
} from '../../utils/userManagementUtils';

const { Text } = Typography;

interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  onActivate?: (userId: string) => void;
  onDeactivate?: (userId: string) => void;
  onResendInvite?: (userId: string) => void;
}

/**
 * User card component for displaying user information
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onResendInvite,
}) => {
  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit User',
      onClick: () => onEdit?.(user.id),
    },
    ...(user.status === UserStatus.PENDING
      ? [
          {
            key: 'resend',
            icon: <SendOutlined />,
            label: 'Resend Invite',
            onClick: () => onResendInvite?.(user.id),
          },
        ]
      : []),
    ...(user.status === UserStatus.ACTIVE
      ? [
          {
            key: 'deactivate',
            icon: <StopOutlined />,
            label: 'Deactivate',
            onClick: () => onDeactivate?.(user.id),
          },
        ]
      : []),
    ...(user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED
      ? [
          {
            key: 'activate',
            icon: <CheckCircleOutlined />,
            label: 'Activate',
            onClick: () => onActivate?.(user.id),
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete User',
      danger: true,
      onClick: () => onDelete?.(user.id),
    },
  ];

  return (
    <Card size="small" hoverable>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          {/* Avatar */}
          {user.avatar ? (
            <Avatar size={48} src={user.avatar} />
          ) : (
            <Avatar size={48} style={{ backgroundColor: '#1890ff' }}>
              {getUserInitials(user)}
            </Avatar>
          )}

          {/* User Info */}
          <Space direction="vertical" size={2}>
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                {getUserFullName(user)}
              </Text>
              <Tag color={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Tag>
              <Tag color={getStatusColor(user.status)}>{getStatusLabel(user.status)}</Tag>
            </Space>

            <Space size={16}>
              <Tooltip title="Email">
                <Space size={4}>
                  <MailOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">{user.email}</Text>
                </Space>
              </Tooltip>

              {user.phoneNumber && (
                <Tooltip title="Phone">
                  <Space size={4}>
                    <PhoneOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary">{user.phoneNumber}</Text>
                  </Space>
                </Tooltip>
              )}

              {user.department && (
                <Tag icon={<UserOutlined />} color="default">
                  {user.department}
                </Tag>
              )}

              {user.jobTitle && (
                <Text type="secondary" italic>
                  {user.jobTitle}
                </Text>
              )}
            </Space>

            <Space size={16}>
              <Tooltip title="Last Login">
                <Space size={4}>
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Last login: {formatLastLogin(user.lastLogin)}
                  </Text>
                </Space>
              </Tooltip>

              {user.status === UserStatus.PENDING && user.invitedAt && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Invited {new Date(user.invitedAt).toLocaleDateString()}
                </Text>
              )}
            </Space>
          </Space>
        </Space>

        {/* Actions */}
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      </Space>
    </Card>
  );
};

export default UserCard;
