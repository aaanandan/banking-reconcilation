import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Divider, Alert, Collapse } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import {
  User,
  UserRole,
  UserStatus,
  Permission,
  getRoleLabel,
  getPermissionsForRole,
  groupPermissionsByCategory,
  getPermissionLabel,
} from '../../utils/userManagementUtils';

const { Panel } = Collapse;

interface UserFormModalProps {
  visible: boolean;
  user: User | null;
  onSave: (user: Partial<User>) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

/**
 * Modal for editing existing user
 */
export const UserFormModal: React.FC<UserFormModalProps> = ({
  visible,
  user,
  onSave,
  onCancel,
  saving = false,
}) => {
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(user?.role || UserRole.USER);

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue(user);
      setSelectedRole(user.role);
    } else {
      form.resetFields();
    }
  }, [visible, user, form]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    // Auto-update permissions based on role
    const permissions = getPermissionsForRole(role);
    form.setFieldsValue({ permissions });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const rolePermissions = getPermissionsForRole(selectedRole);
  const groupedPermissions = groupPermissionsByCategory(rolePermissions);

  return (
    <Modal
      title={
        <>
          <UserOutlined /> Edit User
        </>
      }
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={saving}
      width={700}
      okText="Save Changes"
    >
      <Form form={form} layout="vertical">
        <Alert
          type="info"
          message="User Information"
          description="Update user details, role, and permissions. Changes will take effect immediately."
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Divider orientation="left">Basic Information</Divider>

        <Form.Item
          name="firstName"
          label="First Name"
          rules={[
            { required: true, message: 'First name is required' },
            { max: 50, message: 'First name must be less than 50 characters' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="John" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[
            { required: true, message: 'Last name is required' },
            { max: 50, message: 'Last name must be less than 50 characters' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Doe" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Invalid email format' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="john.doe@example.com" disabled />
        </Form.Item>

        <Form.Item name="phoneNumber" label="Phone Number">
          <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 123-4567" />
        </Form.Item>

        <Form.Item name="department" label="Department">
          <Input placeholder="Finance" />
        </Form.Item>

        <Form.Item name="jobTitle" label="Job Title">
          <Input placeholder="Senior Accountant" />
        </Form.Item>

        <Divider orientation="left">Role & Status</Divider>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Role is required' }]}
        >
          <Select
            onChange={handleRoleChange}
            options={Object.values(UserRole).map((role) => ({
              label: getRoleLabel(role),
              value: role,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Status is required' }]}
        >
          <Select
            options={Object.values(UserStatus).map((status) => ({
              label: status.charAt(0).toUpperCase() + status.slice(1),
              value: status,
            }))}
          />
        </Form.Item>

        <Divider orientation="left">Permissions</Divider>

        <Alert
          type="info"
          message={`${getRoleLabel(selectedRole)} Role Permissions`}
          description={`This role has ${rolePermissions.length} permission${
            rolePermissions.length !== 1 ? 's' : ''
          }. Click categories below to view details.`}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Collapse>
          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <Panel header={`${category} (${permissions.length})`} key={category}>
              <ul style={{ marginLeft: 20 }}>
                {permissions.map((permission) => (
                  <li key={permission}>{getPermissionLabel(permission)}</li>
                ))}
              </ul>
            </Panel>
          ))}
        </Collapse>

        <Form.Item name="permissions" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
