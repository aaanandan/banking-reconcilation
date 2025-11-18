import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message, Alert, Spin, Form } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, WarningOutlined } from '@ant-design/icons';
import { SettingsForm } from './SettingsForm';
import { Settings, validateSettings } from '../../utils/settingsUtils';

const { Title, Text } = Typography;

interface SettingsManagerProps {
  settings: Settings;
  loading?: boolean;
  saving?: boolean;
  onSave: (settings: Settings) => Promise<void>;
  onRefresh?: () => void;
}

/**
 * Main settings management component
 * Handles settings display, editing, validation, and saving
 */
export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  loading = false,
  saving = false,
  onSave,
  onRefresh,
}) => {
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [currentValues, setCurrentValues] = useState<Settings>(settings);

  // Reset form when settings prop changes
  useEffect(() => {
    form.setFieldsValue(settings);
    setCurrentValues(settings);
    setHasChanges(false);
  }, [settings, form]);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    setHasChanges(true);
    setCurrentValues(allValues);

    // Clear validation errors for changed fields
    const changedKeys = Object.keys(changedValues);
    if (changedKeys.length > 0) {
      const newErrors = { ...validationErrors };
      changedKeys.forEach((key) => {
        delete newErrors[key];
      });
      setValidationErrors(newErrors);
    }
  };

  const handleSave = async () => {
    try {
      // Validate form fields
      await form.validateFields();

      // Validate settings with business logic
      const validation = validateSettings(currentValues);

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        message.error('Please fix validation errors before saving');
        return;
      }

      // Clear validation errors
      setValidationErrors({});

      // Save settings
      await onSave(currentValues);

      message.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Failed to save settings: ${error.message}`);
      } else {
        message.error('Failed to save settings');
      }
    }
  };

  const handleReset = () => {
    form.setFieldsValue(settings);
    setCurrentValues(settings);
    setHasChanges(false);
    setValidationErrors({});
    message.info('Changes discarded');
  };

  const handleRefresh = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Refreshing will discard them. Continue?'
      );
      if (!confirmed) return;
    }

    if (onRefresh) {
      onRefresh();
      setHasChanges(false);
      setValidationErrors({});
    }
  };

  return (
    <div>
      {/* Header Card */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            System Settings
          </Title>
          <Space>
            {hasChanges && (
              <Text type="warning" style={{ marginRight: 8 }}>
                <WarningOutlined /> Unsaved changes
              </Text>
            )}
            {onRefresh && (
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                Refresh
              </Button>
            )}
            <Button onClick={handleReset} disabled={!hasChanges || saving}>
              Reset
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || loading}
            >
              Save Changes
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Validation Errors Alert */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert
          type="error"
          message="Validation Errors"
          description={
            <div>
              {Object.entries(validationErrors).map(([category, errors]) => (
                <div key={category}>
                  <Text strong>{category}:</Text>
                  <ul style={{ marginTop: 4, marginBottom: 8 }}>
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          }
          closable
          onClose={() => setValidationErrors({})}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Info Alert */}
      <Alert
        type="info"
        message="System Settings"
        description="Configure system-wide settings for reconciliation, learning, notifications, security, and more. Changes will apply to all users in your organization."
        closable
        style={{ marginBottom: 16 }}
      />

      {/* Settings Form Card */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip="Loading settings..." />
          </div>
        ) : (
          <SettingsForm
            settings={currentValues}
            onValuesChange={handleValuesChange}
            form={form}
          />
        )}
      </Card>

      {/* Last Updated Info */}
      <Card size="small" style={{ marginTop: 16 }}>
        <Space>
          <Text type="secondary">Last updated:</Text>
          <Text>{new Date(settings.updatedAt).toLocaleString()}</Text>
          <Text type="secondary">by</Text>
          <Text strong>{settings.updatedBy}</Text>
        </Space>
      </Card>
    </div>
  );
};

export default SettingsManager;
