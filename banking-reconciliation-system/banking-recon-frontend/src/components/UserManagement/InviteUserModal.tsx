import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Alert, Divider } from 'antd';
import { UserAddOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import {
  UserRole,
  UserInvitation,
  getRoleLabel,
  validateInvitation,
} from '../../utils/userManagementUtils';

const { TextArea } = Input;

interface InviteUserModalProps {
  visible: boolean;
  onInvite: (invitation: UserInvitation) => Promise<void>;
  onCancel: () => void;
  inviting?: boolean;
}

/**
 * Modal for inviting new user
 */
export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  visible,
  onInvite,
  onCancel,
  inviting = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleInvite = async () => {
    try {
      const values = await form.validateFields();

      // Validate invitation
      const validation = validateInvitation(values);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          Modal.error({
            title: 'Validation Error',
            content: error,
          });
        });
        return;
      }

      await onInvite(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={
        <>
          <UserAddOutlined /> Invite New User
        </>
      }
      open={visible}
      onOk={handleInvite}
      onCancel={onCancel}
      confirmLoading={inviting}
      width={600}
      okText="Send Invitation"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          role: UserRole.USER,
        }}
      >
        <Alert
          type="info"
          message="Invite User"
          description="Send an email invitation to a new user. They will receive a link to set up their account and password."
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Divider orientation="left">User Details</Divider>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Invalid email format' },
          ]}
          extra="The invitation will be sent to this email address"
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="john.doe@example.com"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="firstName"
          label="First Name"
          rules={[
            { required: true, message: 'First name is required' },
            { max: 50, message: 'First name must be less than 50 characters' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="John" autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[
            { required: true, message: 'Last name is required' },
            { max: 50, message: 'Last name must be less than 50 characters' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Doe" autoComplete="off" />
        </Form.Item>

        <Divider orientation="left">Role & Department</Divider>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Role is required' }]}
          extra="Select the role for this user. This determines their permissions."
        >
          <Select
            options={Object.values(UserRole).map((role) => ({
              label: getRoleLabel(role),
              value: role,
              disabled: role === UserRole.ADMIN, // Prevent inviting admins directly
            }))}
          />
        </Form.Item>

        <Form.Item name="department" label="Department (Optional)">
          <Input placeholder="Finance" />
        </Form.Item>

        <Form.Item name="jobTitle" label="Job Title (Optional)">
          <Input placeholder="Senior Accountant" />
        </Form.Item>

        <Divider orientation="left">Invitation Message</Divider>

        <Form.Item
          name="message"
          label="Personal Message (Optional)"
          rules={[{ max: 500, message: 'Message must be less than 500 characters' }]}
          extra="Add a personal message to include in the invitation email"
        >
          <TextArea
            rows={4}
            placeholder="Welcome to our team! We're excited to have you join us..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>

      <Alert
        type="warning"
        message="Note"
        description="The new user will be in 'Pending' status until they accept the invitation and complete their account setup."
        showIcon
      />
    </Modal>
  );
};

export default InviteUserModal;
